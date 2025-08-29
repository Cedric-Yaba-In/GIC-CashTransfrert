import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cinetPayService } from '@/lib/cinetpay'

export async function POST() {
  try {
    console.log('Starting CinetPay balance sync...')
    
    // Récupérer tous les sub-wallets CinetPay
    const cinetpaySubWallets = await prisma.subWallet.findMany({
      where: {
        countryPaymentMethod: {
          paymentMethod: {
            type: 'CINETPAY'
          }
        }
      },
      include: {
        countryPaymentMethod: {
          include: {
            country: true,
            paymentMethod: true
          }
        },
        wallet: true
      }
    })

    console.log(`Found ${cinetpaySubWallets.length} CinetPay sub-wallets`)

    let syncedCount = 0
    let totalBalance = 0

    for (const subWallet of cinetpaySubWallets) {
      try {
        const country = subWallet.countryPaymentMethod.country
        const newBalance = await cinetPayService.getBalance(country.currencyCode)
        
        if (newBalance !== null) {
          // Mettre à jour le solde du sub-wallet
          await prisma.subWallet.update({
            where: { id: subWallet.id },
            data: { balance: newBalance }
          })

          console.log(`Updated ${country.name} (${country.currencyCode}): ${newBalance}`)
          syncedCount++
          totalBalance += newBalance
        } else {
          console.warn(`Could not get balance for ${country.name} (${country.currencyCode})`)
        }
      } catch (error) {
        console.error(`Error syncing balance for ${subWallet.countryPaymentMethod.country.name}:`, error)
      }
    }

    // Recalculer les soldes totaux des wallets
    const walletIds = Array.from(new Set(cinetpaySubWallets.map(sw => sw.walletId)))
    
    for (const walletId of walletIds) {
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
        include: { subWallets: true }
      })

      if (wallet) {
        const totalWalletBalance = wallet.subWallets.reduce((sum, sw) => {
          return sum + sw.balance.toNumber()
        }, 0)

        await prisma.wallet.update({
          where: { id: walletId },
          data: { balance: totalWalletBalance }
        })
      }
    }

    console.log(`CinetPay sync completed: ${syncedCount} wallets updated`)

    return NextResponse.json({
      success: true,
      message: `Synchronisation CinetPay terminée: ${syncedCount} portefeuilles mis à jour`,
      syncedCount,
      totalBalance
    })

  } catch (error) {
    console.error('CinetPay sync error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la synchronisation CinetPay'
    }, { status: 500 })
  }
}
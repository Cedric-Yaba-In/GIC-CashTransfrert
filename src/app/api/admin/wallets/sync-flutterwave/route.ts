import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { flutterwaveService } from '@/lib/flutterwave'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Récupérer tous les sous-wallets Flutterwave avec configuration
    const flutterwaveSubWallets = await prisma.subWallet.findMany({
      where: {
        readOnly: true,
        countryPaymentMethod: {
          paymentMethod: {
            type: 'FLUTTERWAVE'
          },
          apiConfig: {
            not: null
          }
        }
      },
      include: {
        wallet: {
          include: {
            country: true
          }
        },
        countryPaymentMethod: {
          include: {
            paymentMethod: true
          }
        }
      }
    })

    let updatedCount = 0
    const results = []

    for (const subWallet of flutterwaveSubWallets) {
      const countryId = subWallet.wallet.country.id
      const countryName = subWallet.wallet.country.name
      
      try {
        const balanceData = await flutterwaveService.getBalance(countryId)
        
        if (balanceData) {
          const { totalBalance, balancesByCurrency } = balanceData
          
          await prisma.subWallet.update({
            where: { id: subWallet.id },
            data: { 
              balance: totalBalance,
              balanceDetails: JSON.stringify(balancesByCurrency)
            }
          })
          
          updatedCount++
          results.push({
            country: countryName,
            totalBalance,
            currencies: balancesByCurrency.length
          })
        }
      } catch (error) {
        console.error(`Error syncing ${countryName}:`, error)
        results.push({
          country: countryName,
          error: 'Sync failed'
        })
      }
    }

    // Recalculer les soldes totaux des wallets
    const walletIds = Array.from(new Set(flutterwaveSubWallets.map(sw => sw.walletId)))
    
    for (const walletId of walletIds) {
      const subWallets = await prisma.subWallet.findMany({
        where: { walletId }
      })
      
      const totalBalance = subWallets.reduce((sum, sw) => sum + sw.balance.toNumber(), 0)
      
      await prisma.wallet.update({
        where: { id: walletId },
        data: { balance: totalBalance }
      })
    }

    return NextResponse.json({ 
      message: `${updatedCount} comptes Flutterwave synchronisés`,
      updatedCount,
      results
    })
  } catch (error) {
    console.error('Sync Flutterwave error:', error)
    return NextResponse.json({ error: 'Erreur de synchronisation' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { flutterwaveService } from '@/lib/flutterwave'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Récupérer tous les sous-wallets Flutterwave
    const flutterwaveSubWallets = await prisma.subWallet.findMany({
      where: {
        readOnly: true,
        countryPaymentMethod: {
          paymentMethod: {
            type: 'FLUTTERWAVE'
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

    for (const subWallet of flutterwaveSubWallets) {
      const country = subWallet.wallet.country
      if (country.currencyCode) {
        const newBalance = await flutterwaveService.getBalance(country.currencyCode)
        
        if (newBalance !== subWallet.balance.toNumber()) {
          await prisma.subWallet.update({
            where: { id: subWallet.id },
            data: { balance: newBalance }
          })
          updatedCount++
        }
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
      message: `${updatedCount} soldes Flutterwave synchronisés`,
      updatedCount 
    })
  } catch (error) {
    console.error('Sync Flutterwave error:', error)
    return NextResponse.json({ error: 'Erreur de synchronisation' }, { status: 500 })
  }
}
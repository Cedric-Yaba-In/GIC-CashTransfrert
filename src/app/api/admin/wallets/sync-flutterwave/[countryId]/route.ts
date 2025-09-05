import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { flutterwaveService } from '@/lib/flutterwave'
import { ExchangeRateService } from '@/lib/exchange-rates'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { countryId: string } }
) {
  try {
    const countryId = parseInt(params.countryId)

    // Récupérer le sous-wallet Flutterwave pour ce pays
    const flutterwaveSubWallet = await prisma.subWallet.findFirst({
      where: {
        readOnly: true,
        countryPaymentMethod: {
          countryId,
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

    if (!flutterwaveSubWallet) {
      return NextResponse.json({ 
        error: 'Flutterwave non configuré pour ce pays' 
      }, { status: 404 })
    }

    // Récupérer les soldes depuis l'API Flutterwave
    const balanceData = await flutterwaveService.getBalance(countryId)
    
    if (!balanceData) {
      return NextResponse.json({ 
        error: 'Impossible de récupérer les soldes Flutterwave' 
      }, { status: 500 })
    }

    const { totalBalance, balancesByCurrency } = balanceData

    // Convertir le solde total dans la devise du pays
    const countryCurrency = flutterwaveSubWallet.wallet.country.currencyCode
    const totalInCountryCurrency = ExchangeRateService.convertToCountryCurrency(
      balancesByCurrency,
      countryCurrency
    )

    // Mettre à jour le sous-wallet avec le solde converti et les détails
    await prisma.subWallet.update({
      where: { id: flutterwaveSubWallet.id },
      data: { 
        balance: totalInCountryCurrency,
        balanceDetails: JSON.stringify(balancesByCurrency)
      }
    })

    // Recalculer le solde total du wallet
    const subWallets = await prisma.subWallet.findMany({
      where: { walletId: flutterwaveSubWallet.walletId }
    })
    
    const totalWalletBalance = subWallets.reduce((sum, sw) => sum + sw.balance.toNumber(), 0)
    
    await prisma.wallet.update({
      where: { id: flutterwaveSubWallet.walletId },
      data: { balance: totalWalletBalance }
    })

    return NextResponse.json({ 
      message: `Soldes Flutterwave synchronisés pour ${flutterwaveSubWallet.wallet.country.name}`,
      totalBalance: totalInCountryCurrency,
      totalBalanceUSD: totalBalance,
      balancesByCurrency,
      countryCurrency,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Sync Flutterwave error:', error)
    return NextResponse.json({ error: 'Erreur de synchronisation' }, { status: 500 })
  }
}
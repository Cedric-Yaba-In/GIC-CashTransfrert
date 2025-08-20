import { NextRequest, NextResponse } from 'next/server'
import { TransferRateService } from '@/lib/transfer-rates'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const senderCountryId = parseInt(searchParams.get('senderCountryId') || '0')
    const receiverCountryId = parseInt(searchParams.get('receiverCountryId') || '0')
    const amount = parseFloat(searchParams.get('amount') || '0')
    const paymentMethodId = searchParams.get('paymentMethodId')

    if (!senderCountryId || !receiverCountryId || !amount) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Récupérer les informations des pays
    const [senderCountry, receiverCountry] = await Promise.all([
      prisma.country.findUnique({ where: { id: senderCountryId } }),
      prisma.country.findUnique({ where: { id: receiverCountryId } })
    ])

    if (!senderCountry || !receiverCountry) {
      return NextResponse.json(
        { error: 'Pays non trouvé' },
        { status: 404 }
      )
    }

    // Calculer les taux selon la hiérarchie
    const rateCalculation = await TransferRateService.calculateTransferRate(
      senderCountryId,
      receiverCountryId,
      amount,
      paymentMethodId ? parseInt(paymentMethodId) : undefined
    )

    // Calculer les montants finaux
    const totalAmount = amount + rateCalculation.totalFees
    const receivedAmount = amount * rateCalculation.finalExchangeRate

    const response = {
      amount,
      baseFee: rateCalculation.baseFee,
      percentageFee: (amount * rateCalculation.percentageFee / 100),
      totalFees: rateCalculation.totalFees,
      totalAmount,
      exchangeRate: rateCalculation.finalExchangeRate,
      receivedAmount,
      senderCurrency: senderCountry.currencyCode,
      receiverCurrency: receiverCountry.currencyCode,
      rateSource: rateCalculation.source,
      breakdown: {
        baseFee: {
          amount: rateCalculation.baseFee,
          currency: senderCountry.currencyCode,
          description: 'Frais de base'
        },
        percentageFee: {
          amount: (amount * rateCalculation.percentageFee / 100),
          currency: senderCountry.currencyCode,
          description: `Commission (${rateCalculation.percentageFee}%)`
        },
        exchangeRate: {
          rate: rateCalculation.exchangeRate,
          margin: rateCalculation.exchangeRateMargin,
          finalRate: rateCalculation.finalExchangeRate,
          description: `Taux de change ${senderCountry.currencyCode}/${receiverCountry.currencyCode}`
        }
      },
      limits: {
        minAmount: rateCalculation.minAmount,
        maxAmount: rateCalculation.maxAmount
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur calcul des taux:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
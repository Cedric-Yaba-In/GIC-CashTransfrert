import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ExchangeRateService } from '@/lib/exchange-rates'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const senderCountryId = searchParams.get('senderCountryId')
    const receiverCountryId = searchParams.get('receiverCountryId')
    const amount = parseFloat(searchParams.get('amount') || '0')

    if (!senderCountryId || !receiverCountryId || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Récupérer les pays
    const [senderCountry, receiverCountry] = await Promise.all([
      prisma.country.findUnique({ where: { id: parseInt(senderCountryId) } }),
      prisma.country.findUnique({ where: { id: parseInt(receiverCountryId) } })
    ])

    if (!senderCountry || !receiverCountry) {
      return NextResponse.json({ error: 'Pays non trouvés' }, { status: 404 })
    }

    // 1. Chercher un corridor spécifique
    const corridor = await prisma.transferCorridor.findFirst({
      where: {
        senderCountryId: parseInt(senderCountryId),
        receiverCountryId: parseInt(receiverCountryId),
        active: true
      }
    })

    // 2. Chercher un taux par pays (destinataire)
    const countryRate = await prisma.countryTransferRate.findFirst({
      where: {
        countryId: parseInt(receiverCountryId),
        active: true
      }
    })

    // 3. Taux global par défaut
    const globalRate = await prisma.transferRate.findFirst({
      where: { isDefault: true, active: true }
    })

    if (!globalRate) {
      return NextResponse.json({ error: 'Aucun taux configuré' }, { status: 500 })
    }

    // Déterminer les frais selon la priorité
    let baseFee = globalRate.baseFee
    let percentageFee = globalRate.percentageFee
    let exchangeRateMargin = globalRate.exchangeRateMargin
    let rateType = 'global'
    let rateName = globalRate.name

    if (countryRate) {
      baseFee = countryRate.baseFee || baseFee
      percentageFee = countryRate.percentageFee || percentageFee
      exchangeRateMargin = countryRate.exchangeRateMargin || exchangeRateMargin
      rateType = 'country'
      rateName = `Taux ${receiverCountry.name}`
    }

    if (corridor) {
      baseFee = corridor.baseFee || baseFee
      percentageFee = corridor.percentageFee || percentageFee
      exchangeRateMargin = corridor.exchangeRateMargin || exchangeRateMargin
      rateType = 'corridor'
      rateName = `${senderCountry.name} → ${receiverCountry.name}`
    }

    // Calculer les frais
    const calculatedPercentageFee = (amount * percentageFee) / 100
    const totalFees = baseFee + calculatedPercentageFee
    const amountAfterFees = amount - totalFees

    // Récupérer le taux de change
    const exchangeRate = await ExchangeRateService.getExchangeRate(
      senderCountry.currencyCode,
      receiverCountry.currencyCode
    )

    // Appliquer la marge sur le taux de change
    const adjustedRate = exchangeRate * (1 - exchangeRateMargin / 100)
    const receivedAmount = amountAfterFees * adjustedRate
    const exchangeMargin = amountAfterFees * (exchangeRate - adjustedRate)

    return NextResponse.json({
      amount,
      senderCurrency: senderCountry.currencyCode,
      receiverCurrency: receiverCountry.currencyCode,
      
      // Frais détaillés
      fees: {
        baseFee: {
          amount: baseFee,
          currency: senderCountry.currencyCode,
          description: 'Frais de base'
        },
        percentageFee: {
          amount: calculatedPercentageFee,
          currency: senderCountry.currencyCode,
          description: `Commission (${percentageFee}%)`
        },
        total: {
          amount: totalFees,
          currency: senderCountry.currencyCode,
          description: 'Total des frais'
        }
      },

      // Taux de change
      exchange: {
        marketRate: exchangeRate,
        appliedRate: adjustedRate,
        margin: exchangeRateMargin,
        marginAmount: exchangeMargin,
        description: `Taux ${senderCountry.currencyCode}/${receiverCountry.currencyCode}`
      },

      // Montants finaux
      summary: {
        amountSent: amount,
        totalPaid: amount,
        amountAfterFees: amountAfterFees,
        amountReceived: receivedAmount,
        totalRevenue: totalFees + exchangeMargin
      },

      // Informations sur le taux appliqué
      rateInfo: {
        type: rateType,
        name: rateName,
        priority: rateType === 'corridor' ? 1 : rateType === 'country' ? 2 : 3
      }
    })

  } catch (error) {
    console.error('Erreur calcul des frais:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
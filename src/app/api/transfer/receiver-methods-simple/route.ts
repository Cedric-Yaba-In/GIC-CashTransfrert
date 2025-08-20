import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateNumericId, validateAmount } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const receiverCountryId = searchParams.get('receiverCountryId')
    const amount = searchParams.get('amount')

    console.log('Simple API called with:', { receiverCountryId, amount })

    const validReceiverCountryId = validateNumericId(receiverCountryId || undefined)
    const validAmount = validateAmount(amount)

    if (!validReceiverCountryId || !validAmount) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Requête simple pour tester
    const country = await prisma.country.findUnique({
      where: { id: validReceiverCountryId }
    })

    if (!country) {
      return NextResponse.json([])
    }

    // Récupérer toutes les méthodes de paiement actives pour ce pays
    const countryMethods = await prisma.countryPaymentMethod.findMany({
      where: {
        countryId: validReceiverCountryId,
        active: true,
        paymentMethod: {
          active: true
        }
      },
      include: {
        paymentMethod: true
      }
    })

    console.log('Found country methods:', countryMethods.length)

    const methods = countryMethods
      .filter(cm => cm.paymentMethod)
      .map(cm => ({
        paymentMethodId: cm.paymentMethodId.toString(),
        paymentMethodName: cm.paymentMethod!.name,
        paymentMethodType: cm.paymentMethod!.type,
        balance: 10000,
        minAmount: 0,
        maxAmount: null,
        countryName: country.name,
        currencyCode: country.currencyCode,
        available: true
      }))

    console.log('Returning methods:', methods)
    return NextResponse.json(methods)

  } catch (error) {
    console.error('Simple API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
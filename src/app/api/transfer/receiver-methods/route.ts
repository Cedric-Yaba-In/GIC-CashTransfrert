import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateNumericId, validateAmount, sanitizeForLog } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const receiverCountryId = searchParams.get('receiverCountryId')
    const amount = searchParams.get('amount')

    const validReceiverCountryId = validateNumericId(receiverCountryId)
    const validAmount = validateAmount(amount)

    if (!validReceiverCountryId || !validAmount) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    const receiverWallet = await prisma.wallet.findUnique({
      where: { countryId: validReceiverCountryId },
      include: {
        country: true,
        subWallets: {
          where: {
            balance: { gte: validAmount }
          },
          include: {
            countryPaymentMethod: {
              include: {
                paymentMethod: {
                  where: { active: true }
                }
              }
            }
          }
        }
      }
    })

    if (!receiverWallet) {
      return NextResponse.json([])
    }

    const availableMethods = receiverWallet.subWallets
      .filter(sw => sw.countryPaymentMethod.paymentMethod)
      .map(sw => ({
        paymentMethodId: sw.countryPaymentMethod.paymentMethodId,
        paymentMethodName: sw.countryPaymentMethod.paymentMethod!.name,
        paymentMethodType: sw.countryPaymentMethod.paymentMethod!.type,
        balance: sw.balance.toNumber(),
        countryName: receiverWallet.country.name,
        currencyCode: receiverWallet.country.currencyCode
      }))

    return NextResponse.json(availableMethods)
  } catch (error) {
    console.error('Erreur récupération méthodes destinataire:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
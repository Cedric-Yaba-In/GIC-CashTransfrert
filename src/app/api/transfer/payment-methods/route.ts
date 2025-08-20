import { NextRequest, NextResponse } from 'next/server'
import { getAvailablePaymentMethods } from '@/lib/wallet-matching'
import { validateNumericId, validateAmount, sanitizeForLog } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const senderCountryId = searchParams.get('senderCountryId')
    const receiverCountryId = searchParams.get('receiverCountryId')
    const amount = searchParams.get('amount')

    // Validation des paramètres
    const validSenderCountryId = validateNumericId(senderCountryId || undefined)
    const validReceiverCountryId = validateNumericId(receiverCountryId || undefined)
    const validAmount = validateAmount(amount)

    if (!validSenderCountryId || !validReceiverCountryId || !validAmount) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    // Récupérer les méthodes de paiement disponibles
    const availableMethods = await getAvailablePaymentMethods(
      validSenderCountryId,
      validReceiverCountryId,
      validAmount
    )

    return NextResponse.json(availableMethods)
  } catch (error) {
    console.error('Erreur récupération méthodes de paiement:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
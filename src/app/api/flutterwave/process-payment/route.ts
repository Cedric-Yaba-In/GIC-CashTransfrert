import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'
import { prisma } from '@/lib/prisma'
import { sanitizeForLog, validateNumericId } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId } = body

    const validTransactionId = validateNumericId(transactionId)
    if (!validTransactionId) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    // Vérifier que la transaction existe et est en attente
    const transaction = await prisma.transaction.findUnique({
      where: { id: validTransactionId },
      include: {
        senderPaymentMethod: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Transaction is not pending' },
        { status: 400 }
      )
    }

    if (transaction.senderPaymentMethod.type !== 'FLUTTERWAVE') {
      return NextResponse.json(
        { error: 'Payment method is not Flutterwave' },
        { status: 400 }
      )
    }

    // Traiter le paiement avec Flutterwave
    const result = await flutterwaveService.processPaymentForTransaction(validTransactionId)
    
    if (result.success) {
      return NextResponse.json({
        status: 'success',
        paymentUrl: result.paymentUrl
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to process payment' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error processing Flutterwave payment:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
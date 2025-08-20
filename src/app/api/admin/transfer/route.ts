import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'
import { prisma } from '@/lib/prisma'
import { sanitizeForLog, validateNumericId } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, action } = body

    const validTransactionId = validateNumericId(transactionId)
    if (!validTransactionId) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: validTransactionId },
      include: {
        receiverPaymentMethod: true,
        receiverCountry: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Approuver la transaction
      await prisma.transaction.update({
        where: { id: validTransactionId },
        data: { status: 'APPROVED' }
      })

      // Si c'est une méthode automatique (Flutterwave), déclencher le transfert
      if (transaction.receiverPaymentMethod?.type === 'FLUTTERWAVE') {
        const transferResult = await flutterwaveService.processTransferToReceiver(validTransactionId)
        
        if (transferResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Transaction approved and transfer completed automatically'
          })
        } else {
          return NextResponse.json({
            success: true,
            message: 'Transaction approved but automatic transfer failed',
            error: transferResult.error
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction approved successfully'
      })
    }

    if (action === 'transfer') {
      // Déclencher le transfert manuellement
      if (transaction.status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'Transaction must be approved first' },
          { status: 400 }
        )
      }

      const transferResult = await flutterwaveService.processTransferToReceiver(validTransactionId)
      
      if (transferResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Transfer completed successfully'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: transferResult.error
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Admin transfer error:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
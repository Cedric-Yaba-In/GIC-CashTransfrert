import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { flutterwaveService } from '@/lib/flutterwave'
import { NotificationService } from '@/lib/notifications'
import { sanitizeForLog } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tx_ref = searchParams.get('tx_ref')
    const transaction_id = searchParams.get('transaction_id')

    console.log('Payment callback received:', { status, tx_ref, transaction_id })

    if (!tx_ref) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer?error=missing_reference`)
    }

    // Extraire la référence de base du tx_ref (enlever le timestamp)
    const baseRef = tx_ref.includes('_') ? tx_ref.substring(0, tx_ref.lastIndexOf('_')) : tx_ref
    console.log('Looking for transaction with tx_ref:', tx_ref, 'baseRef:', baseRef)
    
    const transaction = await prisma.transaction.findFirst({
      where: { 
        OR: [
          { reference: tx_ref },
          { reference: baseRef },
          { flutterwaveRef: tx_ref },
          { flutterwaveRef: baseRef }
        ]
      },
      include: {
        senderCountry: true,
        receiverCountry: true,
        receiverPaymentMethod: true
      }
    })

    if (!transaction) {
      console.error('Transaction not found for tx_ref:', tx_ref, 'baseRef:', baseRef)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${baseRef}&reason=transaction_not_found`)
    }
    
    console.log('Found transaction:', transaction.id, 'current status:', transaction.status)

    console.log('Processing payment callback for transaction:', transaction.id)

    if (status === 'successful' && transaction_id) {
      console.log('Verifying successful payment with Flutterwave')
      const verification = await flutterwaveService.verifyPayment(transaction_id)
      console.log('Flutterwave verification result:', verification)
      
      if (verification && verification.status === 'success' && verification.data?.status === 'successful') {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'PAID',
            flutterwaveRef: transaction_id,
            paidAt: new Date()
          }
        })

        const notificationResults = await NotificationService.sendPaymentConfirmation({
          ...transaction,
          senderCountry: transaction.senderCountry,
          receiverCountry: transaction.receiverCountry
        })
        
        console.log('Notification results:', notificationResults)
        console.log('Payment verified successfully, redirecting to success page')
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/success?ref=${transaction.reference}`)
      } else {
        console.log('Payment verification failed:', verification)
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'FAILED',
            adminNotes: JSON.stringify({
              ...JSON.parse(transaction.adminNotes || '{}'),
              paymentStatus: status,
              flutterwaveTransactionId: transaction_id,
              verificationResult: verification,
              failureReason: 'Payment verification failed'
            })
          }
        })
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=verification_failed`)
      }
    }

    console.log('Payment not successful, status:', status)
    
    let finalStatus = 'FAILED'
    let failureReason = 'Payment failed'
    
    switch (status) {
      case 'cancelled':
        finalStatus = 'CANCELLED'
        failureReason = 'Payment cancelled by user'
        break
      case 'failed':
        finalStatus = 'FAILED'
        failureReason = 'Payment processing failed'
        break
      default:
        finalStatus = 'FAILED'
        failureReason = `Unknown payment status: ${status}`
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        status: finalStatus as any,
        adminNotes: JSON.stringify({
          ...JSON.parse(transaction.adminNotes || '{}'),
          paymentStatus: status,
          flutterwaveTransactionId: transaction_id,
          failureReason
        })
      }
    })

    console.log(`Transaction ${transaction.id} updated to ${finalStatus}`)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=${status}`)

  } catch (error) {
    console.error('Payment callback error:', sanitizeForLog(error))
    
    const { searchParams } = new URL(request.url)
    const tx_ref = searchParams.get('tx_ref')
    
    if (tx_ref) {
      try {
        const transaction = await prisma.transaction.findFirst({
          where: { 
            OR: [
              { reference: tx_ref },
              { flutterwaveRef: tx_ref }
            ]
          }
        })
        
        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'FAILED',
              adminNotes: JSON.stringify({
                ...JSON.parse(transaction.adminNotes || '{}'),
                callbackError: error instanceof Error ? error.message : String(error),
                failureReason: 'Callback processing error'
              })
            }
          })
          
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=callback_error`)
        }
      } catch (updateError) {
        console.error('Failed to update transaction after callback error:', updateError)
      }
    }
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer?error=callback_error`)
  }
}
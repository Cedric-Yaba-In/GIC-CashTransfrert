import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'
import { prisma } from '@/lib/prisma'
import { sanitizeForLog, sanitizeInput } from '@/lib/security'
import { updateWalletBalances } from '@/lib/wallet-matching'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tx_ref = searchParams.get('tx_ref')
    const transaction_id = searchParams.get('transaction_id')

    if (!tx_ref) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?error=missing_params`)
    }
    
    console.log('Flutterwave callback received:', { status, tx_ref, transaction_id })

    // Extraire la référence de transaction de notre système
    const transactionRef = tx_ref.includes('_') ? tx_ref.substring(0, tx_ref.lastIndexOf('_')) : tx_ref
    console.log('Looking for transaction with ref:', transactionRef)
    
    // Trouver la transaction dans notre base
    const transaction = await prisma.transaction.findUnique({
      where: { reference: transactionRef },
      include: {
        senderCountry: true,
        receiverCountry: true,
        senderPaymentMethod: true,
        receiverPaymentMethod: true
      }
    })

    if (!transaction) {
      console.error('Transaction not found for ref:', transactionRef)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?error=transaction_not_found`)
    }

    console.log('Found transaction:', transaction.id, 'status:', transaction.status)

    // Vérifier si la transaction a déjà été traitée
    if (transaction.status === 'PAID' || transaction.status === 'COMPLETED' || transaction.status === 'CANCELLED' || transaction.status === 'FAILED') {
      console.log('Transaction already processed, redirecting based on current status')
      if (transaction.status === 'PAID' || transaction.status === 'COMPLETED') {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/success?ref=${transaction.reference}`)
      } else {
        const reason = transaction.status === 'CANCELLED' ? 'cancelled' : 'failed'
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=${reason}`)
      }
    }

    // Gérer les différents statuts selon la documentation Flutterwave
    switch (status) {
      case 'cancelled':
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'CANCELLED',
            adminNotes: JSON.stringify({
              ...JSON.parse(transaction.adminNotes || '{}'),
              paymentStatus: status,
              flutterwaveTransactionId: transaction_id || 'N/A',
              failureReason: 'Payment cancelled by user',
              timestamp: new Date().toISOString()
            })
          }
        })
        console.log('Transaction marked as CANCELLED')
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=cancelled`)
        
      case 'failed':
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'FAILED',
            adminNotes: JSON.stringify({
              ...JSON.parse(transaction.adminNotes || '{}'),
              paymentStatus: status,
              flutterwaveTransactionId: transaction_id || 'N/A',
              failureReason: 'Payment processing failed',
              timestamp: new Date().toISOString()
            })
          }
        })
        console.log('Transaction marked as FAILED')
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=failed`)
        
      case 'error':
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'FAILED',
            adminNotes: JSON.stringify({
              ...JSON.parse(transaction.adminNotes || '{}'),
              paymentStatus: status,
              flutterwaveTransactionId: transaction_id || 'N/A',
              failureReason: 'Payment error occurred',
              timestamp: new Date().toISOString()
            })
          }
        })
        console.log('Transaction marked as FAILED due to error')
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=error`)
    }
    
    // Pour les paiements réussis, vérifier avec Flutterwave selon la doc officielle
    if (status === 'successful' && transaction_id) {
      console.log('Verifying successful payment with Flutterwave API...')
      const verification = await flutterwaveService.verifyPayment(transaction_id)
      
      if (!verification) {
        console.error('Flutterwave verification returned null')
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'FAILED',
            adminNotes: JSON.stringify({
              ...JSON.parse(transaction.adminNotes || '{}'),
              paymentStatus: status,
              flutterwaveTransactionId: transaction_id,
              failureReason: 'Payment verification API call failed'
            })
          }
        })
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=verification_failed`)
      }
      
      console.log('Verification result:', {
        status: verification.status,
        amount: verification.amount,
        expectedAmount: transaction.totalAmount.toNumber()
      })
      
      if (verification.status === 'successful' && verification.amount >= transaction.totalAmount.toNumber()) {
      // Mettre à jour le statut de la transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'PAID',
          paymentProof: `flutterwave_${transaction_id}`,
          paidAt: new Date(),
          adminNotes: JSON.stringify({
            ...JSON.parse(transaction.adminNotes || '{}'),
            paymentStatus: 'successful',
            flutterwaveTransactionId: transaction_id,
            verificationAmount: verification.amount,
            paymentMethod: verification.payment_type,
            timestamp: new Date().toISOString()
          })
        }
      })
      
      console.log('Transaction marked as PAID, sending notifications')
      
      // Envoyer les notifications
      try {
        const { NotificationService } = await import('@/lib/notifications')
        await NotificationService.sendPaymentConfirmation({
          ...transaction,
          senderCountry: transaction.senderCountry,
          receiverCountry: transaction.receiverCountry
        })
        console.log('Payment confirmation notifications sent')
      } catch (notifError) {
        console.error('Error sending notifications:', notifError)
      }

      // Mettre à jour les soldes des portefeuilles
      if (transaction.receiverPaymentMethod) {
        await updateWalletBalances(
          transaction.senderCountryId,
          transaction.receiverCountryId,
          transaction.receiverPaymentMethod.id,
          transaction.amount.toNumber()
        )
      }

      // Le transfert vers le destinataire nécessite une approbation admin
      // La transaction reste en statut PAID jusqu'à approbation

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/success?ref=${transaction.reference}`)
      } else {
        // Vérification échouée - statut ou montant incorrect
        console.error('Verification failed:', {
          verificationStatus: verification.status,
          verificationAmount: verification.amount,
          expectedStatus: 'successful',
          expectedAmount: transaction.totalAmount.toNumber()
        })
        
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'FAILED',
            adminNotes: JSON.stringify({
              ...JSON.parse(transaction.adminNotes || '{}'),
              paymentStatus: status,
              flutterwaveTransactionId: transaction_id,
              verificationStatus: verification.status,
              verificationAmount: verification.amount,
              expectedAmount: transaction.totalAmount.toNumber(),
              failureReason: verification.status !== 'successful' 
                ? `Payment status is ${verification.status} instead of successful`
                : `Amount mismatch: received ${verification.amount}, expected ${transaction.totalAmount.toNumber()}`
            })
          }
        })
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=verification_failed`)
      }
    } else {
      // Statuts non reconnus ou sans transaction_id
      console.warn('Unhandled payment status or missing transaction_id:', status)
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'FAILED',
          adminNotes: JSON.stringify({
            ...JSON.parse(transaction.adminNotes || '{}'),
            paymentStatus: status || 'unknown',
            flutterwaveTransactionId: transaction_id || 'N/A',
            failureReason: status ? `Unhandled payment status: ${status}` : 'Missing transaction ID for successful payment',
            timestamp: new Date().toISOString()
          })
        }
      })

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/failed?ref=${transaction.reference}&reason=${status || 'unknown'}`)
    }
  } catch (error) {
    console.error('Error processing Flutterwave callback:', sanitizeForLog(error))
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/transfer/payment/failed?error=server_error`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Webhook de Flutterwave pour les notifications
    const body = await request.json()
    const { event, data } = body

    if (event === 'charge.completed') {
      const transactionRef = data.tx_ref.split('_')[0]
      
      const transaction = await prisma.transaction.findUnique({
        where: { reference: transactionRef }
      })

      if (transaction && data.status === 'successful') {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'PAID',
            paymentProof: `flutterwave_${data.id}`
          }
        })
      }
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Error processing Flutterwave webhook:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
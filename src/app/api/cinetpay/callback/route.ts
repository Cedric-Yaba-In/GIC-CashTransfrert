import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cinetPayService } from '@/lib/cinetpay'
import { NotificationService } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('CinetPay callback received:', body)

    const { cpm_trans_id, cpm_site_id, signature, cpm_amount, cpm_currency, cpm_payid, cpm_payment_config, cpm_page_action, cpm_custom, cpm_language, cpm_version, cpm_payment_date, cpm_payment_time, cpm_error_message, cpm_phone_prefixe, cpm_phone_num, cpm_nomprenom, cpm_email, cpm_result } = body

    if (!cpm_trans_id) {
      console.error('Missing transaction ID in CinetPay callback')
      return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 })
    }

    // Extraire la référence de base (enlever le suffixe timestamp)
    const baseReference = cpm_trans_id.includes('_') ? cpm_trans_id.split('_')[0] : cpm_trans_id

    // Trouver la transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { reference: cpm_trans_id },
          { reference: baseReference },
          { cinetpayRef: cpm_trans_id }
        ]
      },
      include: {
        senderCountry: true,
        receiverCountry: true
      }
    })

    if (!transaction) {
      console.error('Transaction not found for CinetPay callback:', cpm_trans_id)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    let redirectUrl = '/transfer/failed'
    let status = transaction.status

    // Traitement selon le résultat du paiement
    if (cpm_result === '00') {
      // Paiement réussi
      status = 'PAID'
      redirectUrl = '/transfer/success'
      
      // Vérifier le paiement avec CinetPay
      const verification = await cinetPayService.verifyPayment(cpm_trans_id)
      
      if (verification && verification.status === 'ACCEPTED') {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            cinetpayRef: cpm_trans_id,
            adminNotes: JSON.stringify({
              ...(transaction.adminNotes ? JSON.parse(transaction.adminNotes) : {}),
              cinetpayPaymentId: cpm_payid,
              cinetpayAmount: cpm_amount,
              cinetpayCurrency: cpm_currency,
              cinetpayPaymentDate: cpm_payment_date,
              cinetpayPaymentTime: cpm_payment_time,
              cinetpayPhone: `${cpm_phone_prefixe}${cpm_phone_num}`,
              cinetpayCustomerName: cpm_nomprenom,
              cinetpayCustomerEmail: cpm_email,
              paymentMethod: 'CINETPAY',
              paymentCompletedAt: new Date().toISOString()
            })
          }
        })

        // Envoyer les notifications
        try {
          await NotificationService.sendPaymentConfirmation(transaction.id)
        } catch (notifError) {
          console.error('Error sending CinetPay payment notifications:', notifError)
        }

        console.log('CinetPay payment successful for transaction:', transaction.reference)
      } else {
        console.error('CinetPay payment verification failed:', verification)
        status = 'PENDING'
        redirectUrl = '/transfer/failed'
      }
    } else {
      // Paiement échoué ou annulé
      console.log('CinetPay payment failed/cancelled:', cpm_result, cpm_error_message)
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          adminNotes: JSON.stringify({
            ...(transaction.adminNotes ? JSON.parse(transaction.adminNotes) : {}),
            cinetpayError: cpm_error_message || 'Paiement échoué',
            cinetpayResult: cpm_result,
            paymentFailedAt: new Date().toISOString()
          })
        }
      })

      status = 'PENDING'
      redirectUrl = '/transfer/failed'
    }

    // Redirection selon l'action de la page
    if (cpm_page_action === 'PAYMENT') {
      const finalRedirectUrl = `${redirectUrl}?ref=${transaction.reference}&status=${status}`
      
      // Pour les callbacks CinetPay, on peut retourner une réponse de redirection
      return NextResponse.redirect(new URL(finalRedirectUrl, request.url))
    }

    // Pour les notifications webhook, retourner une confirmation
    return NextResponse.json({ 
      status: 'success',
      message: 'Callback processed successfully'
    })

  } catch (error) {
    console.error('CinetPay callback error:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Gérer les callbacks GET de CinetPay (return_url)
  const searchParams = request.nextUrl.searchParams
  const transactionId = searchParams.get('transaction_id')
  const token = searchParams.get('token')

  if (!transactionId) {
    return NextResponse.redirect(new URL('/transfer/failed', request.url))
  }

  try {
    // Vérifier le paiement
    const verification = await cinetPayService.verifyPayment(transactionId)
    
    if (verification && verification.status === 'ACCEPTED') {
      return NextResponse.redirect(new URL(`/transfer/success?ref=${transactionId}`, request.url))
    } else {
      return NextResponse.redirect(new URL(`/transfer/failed?ref=${transactionId}`, request.url))
    }
  } catch (error) {
    console.error('CinetPay GET callback error:', error)
    return NextResponse.redirect(new URL('/transfer/failed', request.url))
  }
}
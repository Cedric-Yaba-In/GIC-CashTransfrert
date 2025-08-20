import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cinetPayService } from '@/lib/cinetpay'
import { ConfigService } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID requis' }, { status: 400 })
    }

    // Récupérer la transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        senderCountry: true,
        receiverCountry: true
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 })
    }

    // Générer une référence unique pour CinetPay
    const cinetpayRef = cinetPayService.generateTxRef()
    
    // Récupérer l'URL de base de l'application
    const appUrl = await ConfigService.getAppUrl()
    
    // Préparer les données de paiement CinetPay
    const paymentData = {
      transaction_id: cinetpayRef,
      amount: transaction.totalAmount.toNumber(),
      currency: transaction.senderCountry.currencyCode,
      notify_url: `${appUrl}/api/cinetpay/callback`,
      return_url: `${appUrl}/api/cinetpay/callback`,
      cancel_url: `${appUrl}/transfer/failed?ref=${transaction.reference}`,
      customer_name: transaction.senderName.split(' ')[0] || '',
      customer_surname: transaction.senderName.split(' ').slice(1).join(' ') || '',
      customer_email: transaction.senderEmail || '',
      customer_phone_number: transaction.senderPhone || '',
      customer_address: 'N/A',
      customer_city: 'N/A',
      customer_country: transaction.senderCountry.code,
      customer_state: 'N/A',
      customer_zip_code: '00000',
      description: `Transfert GIC CashTransfer - ${transaction.reference}`,
      channels: 'ALL',
      metadata: JSON.stringify({
        transaction_reference: transaction.reference,
        transaction_id: transaction.id,
        sender_country: transaction.senderCountry.code,
        receiver_country: transaction.receiverCountry.code
      })
    }

    // Créer le paiement avec CinetPay
    const paymentResponse = await cinetPayService.createPayment(paymentData)

    if (!paymentResponse) {
      return NextResponse.json({ 
        error: 'Erreur lors de la création du paiement CinetPay' 
      }, { status: 500 })
    }

    // Mettre à jour la transaction avec la référence CinetPay
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        cinetpayRef: cinetpayRef,
        adminNotes: JSON.stringify({
          ...(transaction.adminNotes ? JSON.parse(transaction.adminNotes) : {}),
          cinetpayPaymentToken: paymentResponse.data.payment_token,
          paymentInitiatedAt: new Date().toISOString()
        })
      }
    })

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.data.payment_url,
      paymentToken: paymentResponse.data.payment_token,
      transactionRef: cinetpayRef
    })

  } catch (error) {
    console.error('CinetPay process payment error:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}
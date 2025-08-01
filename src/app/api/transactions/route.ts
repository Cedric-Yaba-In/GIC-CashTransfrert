import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTransactionReference } from '@/lib/utils'
import { sendEmail, getTransactionEmailTemplate } from '@/lib/email'
import { sendSMS, getTransactionSMSMessage } from '@/lib/sms'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const reference = generateTransactionReference()
    
    const transaction = await prisma.transaction.create({
      data: {
        reference,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        senderPhone: data.senderPhone,
        senderCountryId: data.senderCountryId,
        receiverName: data.receiverName,
        receiverEmail: data.receiverEmail,
        receiverPhone: data.receiverPhone,
        receiverCountryId: data.receiverCountryId,
        amount: data.amount,
        fees: data.fees || 0,
        totalAmount: data.totalAmount,
        paymentMethodId: data.paymentMethodId,
        status: 'PENDING',
      },
      include: {
        senderCountry: true,
        receiverCountry: true,
        paymentMethod: true,
      }
    })

    // Create support ticket
    await prisma.ticket.create({
      data: {
        transactionId: transaction.id,
        subject: `Support pour transaction ${reference}`,
        status: 'OPEN',
      }
    })

    // Send confirmation email
    await sendEmail({
      to: transaction.senderEmail,
      subject: `Confirmation de transaction ${reference}`,
      html: getTransactionEmailTemplate(transaction, 'created'),
    })

    // Send SMS if phone provided
    if (transaction.senderPhone) {
      await sendSMS(transaction.senderPhone, getTransactionSMSMessage(transaction))
    }

    return NextResponse.json({ transaction, reference })
  } catch (error) {
    console.error('Transaction creation error:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')
    
    if (reference) {
      const transaction = await prisma.transaction.findUnique({
        where: { reference },
        include: {
          senderCountry: true,
          receiverCountry: true,
          paymentMethod: true,
        }
      })
      
      if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }
      
      return NextResponse.json(transaction)
    }

    const transactions = await prisma.transaction.findMany({
      include: {
        senderCountry: true,
        receiverCountry: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
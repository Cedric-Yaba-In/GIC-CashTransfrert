import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail, getTransactionEmailTemplate } from '@/lib/email'
import { sendSMS, getTransactionSMSMessage } from '@/lib/sms'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getCurrentUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, adminNotes } = await request.json()
    
    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: { 
        status, 
        adminNotes,
        updatedAt: new Date()
      },
      include: {
        senderCountry: true,
        receiverCountry: true,
        paymentMethod: true,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        transactionId: transaction.id,
        action: `TRANSACTION_${status}`,
        details: { status, adminNotes },
      }
    })

    const statusText = status === 'APPROVED' ? 'approuvée' : 'rejetée'
    await sendEmail({
      to: transaction.senderEmail,
      subject: `Transaction ${statusText} - ${transaction.reference}`,
      html: getTransactionEmailTemplate(transaction, status.toLowerCase()),
    })

    if (transaction.senderPhone) {
      await sendSMS(transaction.senderPhone, getTransactionSMSMessage(transaction))
    }

    return NextResponse.json(transaction)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateNumericId, sanitizeInput, sanitizeForLog, validateCSRFRequest } from '@/lib/security'
import { createCSRFError } from '@/lib/csrf'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!validateCSRFRequest(request as any)) {
      return createCSRFError()
    }

    const transactionId = validateNumericId(params.id)
    if (!transactionId) {
      return NextResponse.json({ error: 'ID transaction invalide' }, { status: 400 })
    }

    const { status, adminNotes } = await request.json()
    
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: sanitizeInput(status), 
        adminNotes: sanitizeInput(adminNotes),
        updatedAt: new Date()
      },
      include: {
        senderCountry: true,
        receiverCountry: true,
        senderPaymentMethod: true,
        receiverPaymentMethod: true,
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Transaction update error:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Erreur de mise à jour de la transaction' }, { status: 500 })
  }
}
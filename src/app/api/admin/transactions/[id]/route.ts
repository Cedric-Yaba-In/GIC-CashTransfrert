import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status, adminNotes } = await request.json()
    
    const transaction = await prisma.transaction.update({
      where: { id: parseInt(params.id) },
      data: { 
        status, 
        adminNotes,
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
    console.error('Transaction update error:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}
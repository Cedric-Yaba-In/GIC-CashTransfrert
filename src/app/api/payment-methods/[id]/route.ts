import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const methodId = parseInt(params.id)

    const paymentMethod = await prisma.paymentMethod.update({
      where: { id: methodId },
      data
    })

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error('Payment method update error:', error)
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      distinct: ['id'],
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error('Payment methods API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
  }
}
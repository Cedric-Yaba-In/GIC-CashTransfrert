import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const basePaymentMethods = await prisma.paymentMethod.findMany({
      where: {
        OR: [
          { type: 'FLUTTERWAVE' },
          { type: 'CINETPAY' },
          { type: 'BANK_TRANSFER' },
          { type: 'MOBILE_MONEY' }
        ]
      },
      orderBy: {
        type: 'asc'
      }
    })

    return NextResponse.json(basePaymentMethods)
  } catch (error) {
    console.error('Error fetching base payment methods:', error)
    return NextResponse.json({ error: 'Erreur de récupération' }, { status: 500 })
  }
}
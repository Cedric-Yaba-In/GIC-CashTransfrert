import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rates = await prisma.transferRate.findMany({
      include: {
        countryRates: {
          include: {
            country: true
          }
        },
        corridorRates: {
          include: {
            senderCountry: true,
            receiverCountry: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Erreur récupération taux:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Si c'est un taux par défaut, désactiver les autres
    if (data.isDefault) {
      await prisma.transferRate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }
    
    const rate = await prisma.transferRate.create({
      data: {
        name: data.name,
        description: data.description || null,
        baseFee: parseFloat(data.baseFee),
        percentageFee: parseFloat(data.percentageFee),
        minAmount: parseFloat(data.minAmount),
        maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
        exchangeRateMargin: parseFloat(data.exchangeRateMargin),
        active: data.active !== false,
        isDefault: data.isDefault || false
      }
    })

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Erreur création taux:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
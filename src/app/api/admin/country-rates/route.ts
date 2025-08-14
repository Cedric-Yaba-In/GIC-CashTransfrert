import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Vérifier qu'un taux pour ce pays n'existe pas déjà
    const existing = await prisma.countryTransferRate.findFirst({
      where: {
        countryId: parseInt(data.countryId)
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Un taux pour ce pays existe déjà' },
        { status: 400 }
      )
    }
    
    // Obtenir le taux global par défaut (ne pas en créer un nouveau)
    const defaultRate = await prisma.transferRate.findFirst({
      where: { isDefault: true }
    })
    
    if (!defaultRate) {
      return NextResponse.json(
        { error: 'Aucun taux global par défaut trouvé. Créez d\'abord un taux global.' },
        { status: 400 }
      )
    }
    
    const countryRate = await prisma.countryTransferRate.create({
      data: {
        countryId: parseInt(data.countryId),
        transferRateId: defaultRate.id,
        baseFee: data.baseFee ? parseFloat(data.baseFee) : null,
        percentageFee: data.percentageFee ? parseFloat(data.percentageFee) : null,
        exchangeRateMargin: data.exchangeRateMargin ? parseFloat(data.exchangeRateMargin) : null,
        active: data.active !== false
      },
      include: {
        country: true,
        transferRate: true
      }
    })

    return NextResponse.json(countryRate)
  } catch (error) {
    console.error('Erreur création taux pays:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const countryRates = await prisma.countryTransferRate.findMany({
      include: {
        country: true,
        transferRate: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(countryRates)
  } catch (error) {
    console.error('Erreur récupération taux pays:', error)
    return NextResponse.json([])
  }
}
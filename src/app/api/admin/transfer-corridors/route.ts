import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const corridors = await prisma.transferCorridor.findMany({
      include: {
        senderCountry: true,
        receiverCountry: true,
        transferRate: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(corridors)
  } catch (error) {
    console.error('Erreur récupération corridors:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Vérifier que le corridor n'existe pas déjà
    const existing = await prisma.transferCorridor.findFirst({
      where: {
        senderCountryId: parseInt(data.senderCountryId),
        receiverCountryId: parseInt(data.receiverCountryId)
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ce corridor existe déjà' },
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
    
    const corridor = await prisma.transferCorridor.create({
      data: {
        senderCountryId: parseInt(data.senderCountryId),
        receiverCountryId: parseInt(data.receiverCountryId),
        transferRateId: defaultRate.id,
        baseFee: data.baseFee ? parseFloat(data.baseFee) : null,
        percentageFee: data.percentageFee ? parseFloat(data.percentageFee) : null,
        exchangeRateMargin: data.exchangeRateMargin ? parseFloat(data.exchangeRateMargin) : null,
        active: data.active !== false
      },
      include: {
        senderCountry: true,
        receiverCountry: true,
        transferRate: true
      }
    })

    return NextResponse.json(corridor)
  } catch (error) {
    console.error('Erreur création corridor:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
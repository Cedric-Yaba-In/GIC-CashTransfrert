import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const id = parseInt(params.id)
    
    const countryRate = await prisma.countryTransferRate.update({
      where: { id },
      data: {
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
    console.error('Erreur modification taux pays:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    
    await prisma.countryTransferRate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression taux pays:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
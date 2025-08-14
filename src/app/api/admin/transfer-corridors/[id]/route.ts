import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const id = parseInt(params.id)
    
    const corridor = await prisma.transferCorridor.update({
      where: { id },
      data: {
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
    console.error('Erreur modification corridor:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    
    await prisma.transferCorridor.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression corridor:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
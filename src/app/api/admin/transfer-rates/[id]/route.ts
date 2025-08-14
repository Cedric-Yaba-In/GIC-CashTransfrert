import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const id = parseInt(params.id)
    
    if (data.isDefault) {
      await prisma.transferRate.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }
    
    const rate = await prisma.transferRate.update({
      where: { id },
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
    console.error('Erreur modification taux:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    
    await prisma.transferRate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression taux:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
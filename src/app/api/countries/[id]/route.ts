import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { active } = await request.json()
    const countryId = parseInt(params.id)

    const country = await prisma.country.update({
      where: { id: countryId },
      data: { active },
      include: {
        region: true,
        paymentMethods: {
          include: {
            paymentMethod: true
          }
        }
      }
    })

    // Créer automatiquement le wallet si le pays est activé
    if (active) {
      await prisma.wallet.upsert({
        where: { countryId },
        update: { active: true },
        create: {
          countryId,
          balance: 0,
          active: true
        }
      })
    }

    return NextResponse.json(country)
  } catch (error) {
    console.error('Country update error:', error)
    return NextResponse.json({ error: 'Failed to update country' }, { status: 500 })
  }
}
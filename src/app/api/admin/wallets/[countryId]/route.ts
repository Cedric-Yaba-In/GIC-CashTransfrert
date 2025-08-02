import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { countryId: string } }
) {
  try {
    const countryId = parseInt(params.countryId)
    
    const country = await prisma.country.findUnique({
      where: { id: countryId },
      include: {
        wallet: {
          include: {
            subWallets: {
              include: {
                countryPaymentMethod: {
                  include: {
                    paymentMethod: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    // Si pas de wallet, créer un wallet virtuel
    if (!country.wallet) {
      return NextResponse.json({
        id: 0,
        countryId: country.id,
        balance: 0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        country,
        subWallets: []
      })
    }

    return NextResponse.json({
      ...country.wallet,
      country,
      subWallets: country.wallet.subWallets.filter(sw => sw.countryPaymentMethod)
    })
  } catch (error) {
    console.error('Wallet detail API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}
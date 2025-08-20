import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { validateQueryParam, sanitizeForLog } from '@/lib/security'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryCode = validateQueryParam(searchParams.get('countryCode') || undefined)

    if (!countryCode) {
      return NextResponse.json(
        { error: 'countryCode est requis' },
        { status: 400 }
      )
    }

    // Récupérer le pays
    const country = await prisma.country.findUnique({
      where: { code: countryCode }
    })

    if (!country) {
      return NextResponse.json(
        { error: 'Pays non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer le wallet principal avec ses sous-wallets
    const wallet = await prisma.wallet.findUnique({
      where: {
        countryId: country.id
      },
      include: {
        subWallets: {
          where: {
            active: true
          },
          include: {
            bank: true,
            countryPaymentMethod: {
              include: {
                paymentMethod: {
                  include: {
                    bank: true
                  }
                }
              }
            }
          }
        },
        country: true
      }
    })

    if (!wallet) {
      return NextResponse.json({
        country,
        wallet: null,
        subWallets: []
      })
    }

    return NextResponse.json({
      country,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        active: wallet.active,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt
      },
      subWallets: wallet.subWallets.map(sw => ({
        id: sw.id,
        balance: sw.balance,
        active: sw.active,
        readOnly: sw.readOnly,
        accountName: sw.accountName,
        accountNumber: sw.accountNumber,
        bank: sw.bank,
        paymentMethod: sw.countryPaymentMethod.paymentMethod,
        createdAt: sw.createdAt,
        updatedAt: sw.updatedAt
      }))
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des wallets:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
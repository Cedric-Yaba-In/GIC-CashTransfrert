import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { countryId } = await request.json()

    if (!countryId) {
      return NextResponse.json(
        { error: 'countryId est requis' },
        { status: 400 }
      )
    }

    // Vérifier si le pays existe
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    })

    if (!country) {
      return NextResponse.json(
        { error: 'Pays non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si Flutterwave existe déjà pour ce pays
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        type: 'FLUTTERWAVE',
        category: 'HYBRID',
        countries: {
          some: {
            countryId: countryId
          }
        }
      }
    })

    if (existingMethod) {
      return NextResponse.json(
        { error: 'Flutterwave est déjà configuré pour ce pays' },
        { status: 409 }
      )
    }

    // S'assurer que le wallet principal du pays existe
    const wallet = await prisma.wallet.upsert({
      where: {
        countryId: countryId
      },
      update: {},
      create: {
        countryId: countryId,
        balance: 0,
        active: true
      }
    })

    // Créer la méthode Flutterwave
    const flutterwaveMethod = await prisma.paymentMethod.create({
      data: {
        name: 'Flutterwave',
        type: 'FLUTTERWAVE',
        category: 'HYBRID',
        minAmount: 100,
        maxAmount: 10000000,
        active: true,
        countries: {
          create: {
            countryId: countryId,
            active: true,
            fees: 0
          }
        }
      },
      include: {
        countries: true
      }
    })

    // Créer le sous-wallet pour Flutterwave
    const countryPaymentMethod = flutterwaveMethod.countries[0]
    if (countryPaymentMethod) {
      await prisma.subWallet.create({
        data: {
          walletId: wallet.id,
          countryPaymentMethodId: countryPaymentMethod.id,
          balance: 0,
          active: true,
          readOnly: true // Flutterwave est en lecture seule
        }
      })
    }

    return NextResponse.json({
      message: 'Méthode Flutterwave créée avec succès',
      method: flutterwaveMethod
    })

  } catch (error) {
    console.error('Erreur lors de la création de Flutterwave:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
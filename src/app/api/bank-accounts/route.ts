import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bankId = searchParams.get('bankId')
    const countryId = searchParams.get('countryId')

    if (!bankId || !countryId) {
      return NextResponse.json(
        { error: 'bankId et countryId sont requis' },
        { status: 400 }
      )
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        bankId: parseInt(bankId),
        countryId: parseInt(countryId)
      },
      include: {
        bank: true,
        country: true
      }
    })

    return NextResponse.json(bankAccounts)

  } catch (error) {
    console.error('Erreur lors de la récupération des comptes bancaires:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bankId, countryId, accountName, accountNumber, iban, swiftCode, routingNumber, branchCode } = await request.json()

    if (!bankId || !countryId || !accountName || !accountNumber) {
      return NextResponse.json(
        { error: 'bankId, countryId, accountName et accountNumber sont requis' },
        { status: 400 }
      )
    }

    const bankAccount = await prisma.bankAccount.upsert({
      where: {
        bankId_countryId: {
          bankId,
          countryId
        }
      },
      update: {
        accountName,
        accountNumber,
        iban: iban || null,
        swiftCode: swiftCode || null,
        routingNumber: routingNumber || null,
        branchCode: branchCode || null
      },
      create: {
        bankId,
        countryId,
        accountName,
        accountNumber,
        iban: iban || null,
        swiftCode: swiftCode || null,
        routingNumber: routingNumber || null,
        branchCode: branchCode || null
      },
      include: {
        bank: true,
        country: true
      }
    })

    // Mettre à jour le sous-wallet associé si il existe
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        type: 'BANK_TRANSFER',
        bank: {
          id: bankId
        },
        countries: {
          some: {
            countryId: countryId
          }
        }
      },
      include: {
        countries: true
      }
    })

    if (paymentMethod && paymentMethod.countries.length > 0) {
      const countryPaymentMethod = paymentMethod.countries.find(cpm => cpm.countryId === countryId)
      if (countryPaymentMethod) {
        await prisma.subWallet.updateMany({
          where: {
            countryPaymentMethodId: countryPaymentMethod.id,
            bankId: bankId
          },
          data: {
            accountNumber: accountNumber,
            accountName: accountName
          }
        })
      }
    }

    return NextResponse.json(bankAccount)

  } catch (error) {
    console.error('Erreur lors de la création du compte bancaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
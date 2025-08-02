import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { paymentMethodId, minAmount, maxAmount, fees } = await request.json()
    const countryId = parseInt(params.id)

    const countryPaymentMethod = await prisma.countryPaymentMethod.upsert({
      where: {
        countryId_paymentMethodId: {
          countryId,
          paymentMethodId
        }
      },
      update: {
        minAmount: minAmount || null,
        maxAmount: maxAmount || null,
        fees: fees || 0,
        active: true
      },
      create: {
        countryId,
        paymentMethodId,
        minAmount: minAmount || null,
        maxAmount: maxAmount || null,
        fees: fees || 0,
        active: true
      },
      include: {
        paymentMethod: true
      }
    })

    // S'assurer que le wallet du pays existe
    const wallet = await prisma.wallet.upsert({
      where: { countryId },
      update: {},
      create: {
        countryId,
        balance: 0,
        active: true
      }
    })

    // Créer automatiquement le sous-wallet
    await prisma.subWallet.upsert({
      where: { countryPaymentMethodId: countryPaymentMethod.id },
      update: { active: true },
      create: {
        walletId: wallet.id,
        countryPaymentMethodId: countryPaymentMethod.id,
        balance: 0,
        active: true
      }
    })

    return NextResponse.json(countryPaymentMethod)
  } catch (error) {
    console.error('Country payment method creation error:', error)
    return NextResponse.json({ error: 'Failed to add payment method' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { paymentMethodId } = await request.json()
    const countryId = parseInt(params.id)

    // Trouver le CountryPaymentMethod à supprimer
    const countryPaymentMethod = await prisma.countryPaymentMethod.findUnique({
      where: {
        countryId_paymentMethodId: {
          countryId,
          paymentMethodId
        }
      },
      include: {
        subWallet: true
      }
    })

    if (countryPaymentMethod) {
      // Supprimer d'abord le SubWallet s'il existe
      if (countryPaymentMethod.subWallet) {
        await prisma.subWallet.delete({
          where: { id: countryPaymentMethod.subWallet.id }
        })
      }

      // Puis supprimer le CountryPaymentMethod
      await prisma.countryPaymentMethod.delete({
        where: { id: countryPaymentMethod.id }
      })

      // Recalculer le solde total du wallet
      const wallet = await prisma.wallet.findUnique({
        where: { countryId },
        include: { subWallets: true }
      })

      if (wallet) {
        const totalBalance = wallet.subWallets.reduce((sum, sw) => {
          return sum + sw.balance.toNumber()
        }, 0)

        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: totalBalance }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Country payment method deletion error:', error)
    return NextResponse.json({ error: 'Failed to remove payment method' }, { status: 500 })
  }
}
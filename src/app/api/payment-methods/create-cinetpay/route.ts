import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cinetPayService } from '@/lib/cinetpay'

export async function POST(request: Request) {
  try {
    const { countryId } = await request.json()

    if (!countryId) {
      return NextResponse.json({ error: 'Country ID requis' }, { status: 400 })
    }

    // Vérifier que le pays existe
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    })

    if (!country) {
      return NextResponse.json({ error: 'Pays non trouvé' }, { status: 404 })
    }

    // Récupérer ou créer la méthode CinetPay de base
    let cinetpayMethod = await prisma.paymentMethod.findFirst({
      where: { 
        type: 'CINETPAY',
        name: 'CinetPay'
      }
    })

    if (!cinetpayMethod) {
      cinetpayMethod = await prisma.paymentMethod.create({
        data: {
          name: 'CinetPay',
          type: 'CINETPAY',
          category: 'HYBRID',
          minAmount: 1000,
          maxAmount: 5000000,
          active: true
        }
      })
    }

    // Vérifier si CinetPay est déjà associé à ce pays
    const existingAssociation = await prisma.countryPaymentMethod.findUnique({
      where: {
        countryId_paymentMethodId: {
          countryId,
          paymentMethodId: cinetpayMethod.id
        }
      }
    })

    if (existingAssociation) {
      return NextResponse.json({ error: 'CinetPay est déjà activé pour ce pays' }, { status: 400 })
    }

    // Créer l'association pays-méthode
    const countryPaymentMethod = await prisma.countryPaymentMethod.create({
      data: {
        countryId,
        paymentMethodId: cinetpayMethod.id,
        active: true,
        fees: 0
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

    // Créer le sous-wallet avec solde initial CinetPay
    let initialBalance = 0
    try {
      const balance = await cinetPayService.getBalance(country.currencyCode)
      initialBalance = balance ?? 0
    } catch (error) {
      console.log('CinetPay balance not available, using 0')
      initialBalance = 0
    }

    await prisma.subWallet.create({
      data: {
        walletId: wallet.id,
        countryPaymentMethodId: countryPaymentMethod.id,
        balance: initialBalance,
        active: true,
        readOnly: true // CinetPay est en lecture seule comme Flutterwave
      }
    })

    // Recalculer le solde total du wallet
    const updatedWallet = await prisma.wallet.findUnique({
      where: { id: wallet.id },
      include: { subWallets: true }
    })

    if (updatedWallet) {
      const totalBalance = updatedWallet.subWallets.reduce((sum, sw) => {
        return sum + sw.balance.toNumber()
      }, 0)

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: totalBalance }
      })
    }

    return NextResponse.json({
      success: true,
      message: `CinetPay activé pour ${country.name}`,
      paymentMethod: cinetpayMethod,
      initialBalance
    })

  } catch (error) {
    console.error('Create CinetPay error:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'activation de CinetPay' 
    }, { status: 500 })
  }
}
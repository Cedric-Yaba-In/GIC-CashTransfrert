import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { flutterwaveService } from '@/lib/flutterwave'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { countryId: string } }
) {
  try {
    const countryId = parseInt(params.countryId)

    // Vérifier que le pays existe
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    })

    if (!country) {
      return NextResponse.json(
        { error: 'Pays non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer le sous-wallet Flutterwave pour ce pays
    const subWallet = await prisma.subWallet.findFirst({
      where: {
        wallet: {
          countryId: countryId
        },
        countryPaymentMethod: {
          paymentMethod: {
            type: 'FLUTTERWAVE'
          }
        }
      },
      include: {
        bank: true,
        wallet: {
          include: {
            country: true
          }
        },
        countryPaymentMethod: {
          include: {
            paymentMethod: true
          }
        }
      }
    })

    if (!subWallet) {
      return NextResponse.json(
        { error: 'Aucun sous-wallet Flutterwave trouvé pour ce pays' },
        { status: 404 }
      )
    }

    console.log("Fetching Flutterwave balance for currency:", country.currencyCode)
    // Récupérer le solde réel depuis l'API Flutterwave via le service
    const newFlutterwaveBalance = await flutterwaveService.getBalance(country.currencyCode)
    
    if (newFlutterwaveBalance === null) {
      return NextResponse.json(
        { 
          error: 'Impossible de récupérer le solde Flutterwave', 
          details: 'Timeout ou erreur de connexion à l\'API Flutterwave',
          suggestion: 'Vérifiez votre connexion internet et les clés API Flutterwave'
        },
        { status: 500 }
      )
    }

    // Sauvegarder l'ancien solde pour calculer la différence
    const oldBalance = Number(subWallet.balance)
    
    // Mettre à jour le solde du sous-wallet avec le nouveau solde exact
    const updatedSubWallet = await prisma.subWallet.update({
      where: { id: subWallet.id },
      data: { balance: Number(newFlutterwaveBalance) }
    })

    // Recalculer le solde total du wallet principal en additionnant tous les sous-wallets
    const totalBalance = await prisma.subWallet.aggregate({
      where: { walletId: subWallet.walletId },
      _sum: { balance: true }
    })

    // Mettre à jour le solde du wallet principal avec le total exact
    await prisma.wallet.update({
      where: { id: subWallet.walletId },
      data: { balance: Number(totalBalance._sum.balance) || 0 }
    })

    return NextResponse.json({
      message: `Solde Flutterwave synchronisé pour ${country.name}`,
      country: country.name,
      oldBalance: oldBalance,
      newBalance: newFlutterwaveBalance,
      totalWalletBalance: Number(totalBalance._sum.balance) || 0,
      subWallet: updatedSubWallet
    })

  } catch (error) {
    console.error('Erreur lors de la synchronisation Flutterwave:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
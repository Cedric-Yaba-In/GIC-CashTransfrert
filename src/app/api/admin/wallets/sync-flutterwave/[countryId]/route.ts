import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ConfigService } from '@/lib/config'

const prisma = new PrismaClient()

// Fonction pour récupérer le solde Flutterwave pour un pays
async function getFlutterwaveBalance(currencyCode: string): Promise<number | null> {
  try {
    const secretKey = await ConfigService.get('FLUTTERWAVE_SECRET_KEY')
    if (!secretKey) {
      console.error('FLUTTERWAVE_SECRET_KEY non configurée en base de données')
      return null
    }

    if (!currencyCode) {
      console.error('Code de devise manquant')
      return null
    }
    // Appel à l'API Flutterwave pour récupérer le solde du wallet avec la devise spécifique
    const response = await fetch(`https://api.flutterwave.com/v3/balances/${currencyCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    // Si l'endpoint spécifique échoue, essayer l'endpoint général
    if (!response.ok && response.status === 404) {
      const generalResponse = await fetch('https://api.flutterwave.com/v3/balances', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        }
      })
      
      if (!generalResponse.ok) {
        if (generalResponse.status === 401) {
          console.error('Erreur API Flutterwave: Clé API invalide ou expirée')
          return null
        }
        console.error('Erreur API Flutterwave (général):', generalResponse.status, generalResponse.statusText)
        return null
      }
      
      const generalData = await generalResponse.json()
      if (generalData.status !== 'success') {
        console.error('Réponse Flutterwave non réussie (général):', generalData)
        return null
      }

      // Trouver le solde pour la devise du pays dans la réponse générale
      const balanceData = generalData.data.find((balance: any) => balance.currency === currencyCode)
      
      if (!balanceData) {
        console.error(`Solde non trouvé pour la devise: ${currencyCode}`)
        return 0
      }

      return Number(balanceData.available_balance) || 0
    }

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Erreur API Flutterwave: Clé API invalide ou expirée')
        return null
      }
      console.error('Erreur API Flutterwave (spécifique):', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    
    if (data.status !== 'success') {
      console.error('Réponse Flutterwave non réussie (spécifique):', data)
      return null
    }

    // Pour l'endpoint spécifique, la réponse peut être directe
    if (data.data && typeof data.data === 'object' && data.data.currency === currencyCode) {
      return Number(data.data.available_balance) || 0
    }
    
    // Si c'est un tableau, chercher la devise
    if (Array.isArray(data.data)) {
      const balanceData = data.data.find((balance: any) => balance.currency === currencyCode)
      if (balanceData) {
        return Number(balanceData.available_balance) || 0
      }
    }

    console.error(`Format de réponse inattendu pour la devise: ${currencyCode}`, data)
    return 0

  } catch (error) {
    console.error('Erreur lors de la récupération du solde Flutterwave:', error)
    return null
  }
}

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

    console.log("Here wallet currency ",country.currencyCode)
    // Récupérer le solde réel depuis l'API Flutterwave
    const newFlutterwaveBalance = await getFlutterwaveBalance(country.currencyCode)
    
    if (newFlutterwaveBalance === null) {
      return NextResponse.json(
        { error: 'Impossible de récupérer le solde Flutterwave' },
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
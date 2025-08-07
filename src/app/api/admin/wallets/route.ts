import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Récupérer tous les pays actifs
    const countries = await prisma.country.findMany({
      where: { active: true },
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
      },
      orderBy: { name: 'asc' }
    })

    // Transformer en format wallet avec pays sans wallet = wallet vide
    const wallets = countries.map(country => {
      if (country.wallet) {
        return {
          ...country.wallet,
          country,
          subWallets: country.wallet.subWallets.filter(sw => sw.countryPaymentMethod)
        }
      } else {
        return {
          id: 0,
          countryId: country.id,
          balance: 0,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          country,
          subWallets: []
        }
      }
    })
    
    return NextResponse.json(wallets)
  } catch (error) {
    console.error('Wallets API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { subWalletId, amount, operation } = await request.json()
    
    const subWallet = await prisma.subWallet.findUnique({
      where: { id: subWalletId },
      include: {
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
      return NextResponse.json({ error: 'SubWallet not found' }, { status: 404 })
    }

    // Vérifier si le wallet est en lecture seule (Flutterwave)
    if (subWallet.readOnly === true) {
      return NextResponse.json({ 
        error: 'Opération non autorisée sur un wallet Flutterwave. Le solde est synchronisé automatiquement.' 
      }, { status: 403 })
    }

    const currentBalance = subWallet.balance.toNumber()
    const newBalance = operation === 'credit' 
      ? currentBalance + amount
      : currentBalance - amount

    if (newBalance < 0) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Mettre à jour le sous-wallet
    const updatedSubWallet = await prisma.subWallet.update({
      where: { id: subWalletId },
      data: { balance: newBalance }
    })

    // Mettre à jour le solde total du wallet principal
    const walletSubWallets = await prisma.subWallet.findMany({
      where: { walletId: subWallet.walletId }
    })
    
    const totalBalance = walletSubWallets.reduce((sum, sw) => {
      return sum + (sw.id === subWalletId ? newBalance : sw.balance.toNumber())
    }, 0)

    await prisma.wallet.update({
      where: { id: subWallet.walletId },
      data: { balance: totalBalance }
    })

    return NextResponse.json(updatedSubWallet)
  } catch (error) {
    console.error('Wallet operation error:', error)
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getCurrentUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wallets = await prisma.wallet.findMany({
      include: {
        country: true,
        subWallets: {
          include: {
            paymentMethod: true
          }
        }
      }
    })

    return NextResponse.json(wallets)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getCurrentUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subWalletId, amount, operation } = await request.json()
    
    const subWallet = await prisma.subWallet.findUnique({
      where: { id: subWalletId },
      include: { wallet: { include: { country: true } }, paymentMethod: true }
    })

    if (!subWallet) {
      return NextResponse.json({ error: 'SubWallet not found' }, { status: 404 })
    }

    const newBalance = operation === 'credit' 
      ? subWallet.balance.toNumber() + amount
      : subWallet.balance.toNumber() - amount

    if (newBalance < 0) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const updatedSubWallet = await prisma.subWallet.update({
      where: { id: subWalletId },
      data: { balance: newBalance }
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: `WALLET_${operation.toUpperCase()}`,
        details: { 
          subWalletId, 
          amount, 
          oldBalance: subWallet.balance.toNumber(),
          newBalance 
        },
      }
    })

    return NextResponse.json(updatedSubWallet)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
  }
}
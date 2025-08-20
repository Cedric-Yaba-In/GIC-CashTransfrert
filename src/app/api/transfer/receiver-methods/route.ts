import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateNumericId, validateAmount, sanitizeForLog } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const receiverCountryId = searchParams.get('receiverCountryId')
    const amount = searchParams.get('amount')

    console.log('Receiver methods API called with:', { receiverCountryId, amount })

    const validReceiverCountryId = validateNumericId(receiverCountryId || undefined)
    const validAmount = validateAmount(amount)

    if (!validReceiverCountryId || !validAmount) {
      console.log('Invalid parameters:', { validReceiverCountryId, validAmount })
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    const receiverWallet = await prisma.wallet.findUnique({
      where: { countryId: validReceiverCountryId },
      include: {
        country: true,
        subWallets: {
          where: {
            active: true,
            countryPaymentMethod: {
              active: true,
              paymentMethod: {
                active: true
              }
            }
          },
          include: {
            countryPaymentMethod: {
              include: {
                paymentMethod: true
              }
            }
          }
        }
      }
    })

    console.log('Found wallet:', receiverWallet ? 'Yes' : 'No')
    if (receiverWallet) {
      console.log('Sub-wallets count:', receiverWallet.subWallets.length)
      receiverWallet.subWallets.forEach(sw => {
        console.log('Sub-wallet:', {
          id: sw.id,
          balance: sw.balance.toNumber(),
          method: sw.countryPaymentMethod.paymentMethod?.name,
          hasEnoughBalance: sw.balance.toNumber() >= validAmount
        })
      })
    }

    if (!receiverWallet) {
      console.log('No wallet found for country:', validReceiverCountryId)
      return NextResponse.json([])
    }

    // Filtrer les sous-portefeuilles avec suffisamment de solde
    const availableMethods = receiverWallet.subWallets
      .filter(sw => {
        if (!sw.countryPaymentMethod?.paymentMethod) {
          console.log('No payment method for sub-wallet:', sw.id)
          return false
        }
        
        const balance = Number(sw.balance)
        const hasEnoughBalance = balance >= validAmount
        
        console.log('Filtering sub-wallet:', {
          method: sw.countryPaymentMethod.paymentMethod.name,
          balance: balance,
          requiredAmount: validAmount,
          hasEnoughBalance,
          passes: hasEnoughBalance
        })
        
        return hasEnoughBalance
      })
      .map(sw => ({
        paymentMethodId: sw.countryPaymentMethod.paymentMethodId.toString(),
        paymentMethodName: sw.countryPaymentMethod.paymentMethod!.name,
        paymentMethodType: sw.countryPaymentMethod.paymentMethod!.type,
        balance: Number(sw.balance),
        minAmount: sw.countryPaymentMethod.minAmount ? Number(sw.countryPaymentMethod.minAmount) : 0,
        maxAmount: sw.countryPaymentMethod.maxAmount ? Number(sw.countryPaymentMethod.maxAmount) : null,
        countryName: receiverWallet.country.name,
        currencyCode: receiverWallet.country.currencyCode,
        available: true
      }))

    console.log('Available methods:', availableMethods)
    return NextResponse.json(availableMethods)
  } catch (error) {
    console.error('Erreur récupération méthodes destinataire:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
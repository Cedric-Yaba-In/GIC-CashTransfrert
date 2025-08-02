import { prisma } from './prisma'

export interface PaymentMethodAvailability {
  paymentMethodId: string
  paymentMethodName: string
  paymentMethodType: string
  available: boolean
  balance: number
  minAmount: number
  maxAmount: number | null
  countryId: string
  countryName: string
  currencyCode: string
}

export async function getAvailablePaymentMethods(
  senderCountryId: string,
  receiverCountryId: string,
  amount: number
): Promise<PaymentMethodAvailability[]> {
  try {
    // Get sender country payment methods
    const senderCountryMethods = await prisma.countryPaymentMethod.findMany({
      where: {
        countryId: senderCountryId,
        active: true,
        minAmount: { lte: amount },
        OR: [
          { maxAmount: null },
          { maxAmount: { gte: amount } }
        ]
      },
      include: {
        paymentMethod: {
          where: { active: true }
        },
        country: true
      }
    })

    // Get receiver country wallets and sub-wallets
    const receiverWallet = await prisma.wallet.findUnique({
      where: { countryId: receiverCountryId },
      include: {
        country: true,
        subWallets: {
          include: {
            paymentMethod: {
              where: { active: true }
            }
          }
        }
      }
    })

    if (!receiverWallet) {
      return []
    }

    const availableMethods: PaymentMethodAvailability[] = []

    for (const senderMethod of senderCountryMethods) {
      if (!senderMethod.paymentMethod) continue

      // Check if receiver country has sufficient balance for this payment method
      const receiverSubWallet = receiverWallet.subWallets.find(
        sw => sw.paymentMethodId === senderMethod.paymentMethodId
      )

      const hasBalance = receiverSubWallet ? receiverSubWallet.balance.toNumber() >= amount : false

      availableMethods.push({
        paymentMethodId: senderMethod.paymentMethodId,
        paymentMethodName: senderMethod.paymentMethod.name,
        paymentMethodType: senderMethod.paymentMethod.type,
        available: hasBalance,
        balance: receiverSubWallet?.balance.toNumber() || 0,
        minAmount: senderMethod.minAmount.toNumber(),
        maxAmount: senderMethod.maxAmount?.toNumber() || null,
        countryId: senderMethod.countryId,
        countryName: senderMethod.country.name,
        currencyCode: senderMethod.country.currencyCode
      })
    }

    return availableMethods.sort((a, b) => {
      // Sort by availability first, then by balance
      if (a.available && !b.available) return -1
      if (!a.available && b.available) return 1
      return b.balance - a.balance
    })

  } catch (error) {
    console.error('Error getting available payment methods:', error)
    return []
  }
}

export async function checkWalletBalance(
  countryId: string,
  paymentMethodId: string,
  amount: number
): Promise<boolean> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { countryId },
      include: {
        subWallets: {
          where: { paymentMethodId }
        }
      }
    })

    if (!wallet || wallet.subWallets.length === 0) {
      return false
    }

    return wallet.subWallets[0].balance.toNumber() >= amount
  } catch (error) {
    console.error('Error checking wallet balance:', error)
    return false
  }
}

export async function updateWalletBalances(
  senderCountryId: string,
  receiverCountryId: string,
  paymentMethodId: string,
  amount: number
) {
  try {
    await prisma.$transaction(async (tx) => {
      // Debit receiver country sub-wallet
      const receiverWallet = await tx.wallet.findUnique({
        where: { countryId: receiverCountryId },
        include: { subWallets: { where: { paymentMethodId } } }
      })

      if (receiverWallet && receiverWallet.subWallets.length > 0) {
        const subWallet = receiverWallet.subWallets[0]
        await tx.subWallet.update({
          where: { id: subWallet.id },
          data: { balance: { decrement: amount } }
        })

        // Update main wallet balance
        await tx.wallet.update({
          where: { id: receiverWallet.id },
          data: { balance: { decrement: amount } }
        })
      }

      // Credit sender country sub-wallet (for future transfers)
      const senderWallet = await tx.wallet.findUnique({
        where: { countryId: senderCountryId },
        include: { subWallets: { where: { paymentMethodId } } }
      })

      if (senderWallet) {
        if (senderWallet.subWallets.length > 0) {
          const subWallet = senderWallet.subWallets[0]
          await tx.subWallet.update({
            where: { id: subWallet.id },
            data: { balance: { increment: amount } }
          })
        } else {
          // Create sub-wallet if it doesn't exist
          await tx.subWallet.create({
            data: {
              walletId: senderWallet.id,
              paymentMethodId,
              balance: amount
            }
          })
        }

        // Update main wallet balance
        await tx.wallet.update({
          where: { id: senderWallet.id },
          data: { balance: { increment: amount } }
        })
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating wallet balances:', error)
    return { success: false, error }
  }
}
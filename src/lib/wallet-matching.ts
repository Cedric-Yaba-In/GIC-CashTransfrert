import { prisma } from './prisma'
import { sanitizeForLog } from './security'

export interface PaymentMethodAvailability {
  paymentMethodId: number
  paymentMethodName: string
  paymentMethodType: string
  available: boolean
  balance: number
  minAmount: number
  maxAmount: number | null
  countryId: number
  countryName: string
  currencyCode: string
}

export async function getAvailablePaymentMethods(
  senderCountryId: number,
  receiverCountryId: number,
  amount: number
): Promise<PaymentMethodAvailability[]> {
  try {
    // Validate inputs
    if (!Number.isInteger(senderCountryId) || senderCountryId <= 0 ||
        !Number.isInteger(receiverCountryId) || receiverCountryId <= 0 ||
        !Number.isFinite(amount) || amount <= 0) {
      return []
    }

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
        paymentMethod: true,
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
            countryPaymentMethod: {
              include: {
                paymentMethod: true
              }
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
      if (!senderMethod.paymentMethod || !senderMethod.paymentMethod.active) continue

      // Check if receiver country has sufficient balance for this payment method
      const receiverSubWallet = receiverWallet.subWallets.find(
        sw => sw.countryPaymentMethod.paymentMethodId === senderMethod.paymentMethodId
      )

      const hasBalance = receiverSubWallet ? receiverSubWallet.balance.toNumber() >= amount : false

      availableMethods.push({
        paymentMethodId: senderMethod.paymentMethodId,
        paymentMethodName: senderMethod.paymentMethod.name,
        paymentMethodType: senderMethod.paymentMethod.type,
        available: hasBalance,
        balance: receiverSubWallet?.balance.toNumber() || 0,
        minAmount: senderMethod.minAmount?.toNumber() || 0,
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
    console.error('Error getting available payment methods:', sanitizeForLog(error))
    return []
  }
}

export async function checkWalletBalance(
  countryId: number,
  paymentMethodId: number,
  amount: number
): Promise<boolean> {
  try {
    // Validate inputs
    if (!Number.isInteger(countryId) || countryId <= 0 ||
        !Number.isInteger(paymentMethodId) || paymentMethodId <= 0 ||
        !Number.isFinite(amount) || amount <= 0) {
      return false
    }

    const wallet = await prisma.wallet.findUnique({
      where: { countryId },
      include: {
        subWallets: {
          where: {
            countryPaymentMethod: {
              paymentMethodId
            }
          }
        }
      }
    })

    if (!wallet || wallet.subWallets.length === 0) {
      return false
    }

    return wallet.subWallets[0].balance.toNumber() >= amount
  } catch (error) {
    console.error('Error checking wallet balance:', sanitizeForLog(error))
    return false
  }
}

export async function updateWalletBalances(
  senderCountryId: number,
  receiverCountryId: number,
  paymentMethodId: number,
  amount: number
) {
  try {
    // Validate inputs
    if (!Number.isInteger(senderCountryId) || senderCountryId <= 0 ||
        !Number.isInteger(receiverCountryId) || receiverCountryId <= 0 ||
        !Number.isInteger(paymentMethodId) || paymentMethodId <= 0 ||
        !Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'Invalid parameters' }
    }

    await prisma.$transaction(async (tx) => {
      // Debit receiver country sub-wallet
      const receiverWallet = await tx.wallet.findUnique({
        where: { countryId: receiverCountryId },
        include: {
          subWallets: {
            where: {
              countryPaymentMethod: {
                paymentMethodId
              }
            }
          }
        }
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
        include: {
          subWallets: {
            where: {
              countryPaymentMethod: {
                paymentMethodId
              }
            }
          }
        }
      })

      if (senderWallet) {
        if (senderWallet.subWallets.length > 0) {
          const subWallet = senderWallet.subWallets[0]
          await tx.subWallet.update({
            where: { id: subWallet.id },
            data: { balance: { increment: amount } }
          })
        } else {
          // Create CountryPaymentMethod first if needed
          const countryPaymentMethod = await tx.countryPaymentMethod.upsert({
            where: {
              countryId_paymentMethodId: {
                countryId: senderCountryId,
                paymentMethodId
              }
            },
            create: {
              countryId: senderCountryId,
              paymentMethodId,
              active: true
            },
            update: {}
          })
          
          await tx.subWallet.create({
            data: {
              walletId: senderWallet.id,
              countryPaymentMethodId: countryPaymentMethod.id,
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
    console.error('Error updating wallet balances:', sanitizeForLog(error))
    return { success: false, error: 'Database error' }
  }
}
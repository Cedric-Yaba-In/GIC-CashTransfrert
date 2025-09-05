import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'
import { prisma } from '@/lib/prisma'
import { sanitizeForLog } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id, tx_ref, countryId } = body

    if (!transaction_id || !countryId) {
      return NextResponse.json(
        { error: 'Transaction ID and countryId are required' },
        { status: 400 }
      )
    }

    const verification = await flutterwaveService.verifyPayment(parseInt(countryId), transaction_id)
    
    if (verification && verification.status === 'successful') {
      // Update wallet balance
      const { currency, amount, customer } = verification
      
      // Find country by currency
      const country = await prisma.country.findFirst({
        where: { currencyCode: currency }
      })

      if (country) {
        // Find or create wallet
        let wallet = await prisma.wallet.findUnique({
          where: { countryId: country.id }
        })

        if (!wallet) {
          wallet = await prisma.wallet.create({
            data: {
              countryId: country.id,
              balance: 0
            }
          })
        }

        // Find Flutterwave payment method
        const flutterwaveMethod = await prisma.paymentMethod.findFirst({
          where: { type: 'FLUTTERWAVE' }
        })

        if (flutterwaveMethod) {
          // Find or create country payment method
          let countryPaymentMethod = await prisma.countryPaymentMethod.findUnique({
            where: {
              countryId_paymentMethodId: {
                countryId: country.id,
                paymentMethodId: flutterwaveMethod.id
              }
            }
          })

          if (!countryPaymentMethod) {
            countryPaymentMethod = await prisma.countryPaymentMethod.create({
              data: {
                countryId: country.id,
                paymentMethodId: flutterwaveMethod.id,
                active: true
              }
            })
          }

          // Find or create sub-wallet
          let subWallet = await prisma.subWallet.findFirst({
            where: {
              walletId: wallet.id,
              countryPaymentMethodId: countryPaymentMethod.id
            }
          })

          if (!subWallet) {
            subWallet = await prisma.subWallet.create({
              data: {
                walletId: wallet.id,
                countryPaymentMethodId: countryPaymentMethod.id,
                balance: 0
              }
            })
          }

          // Update balances
          await prisma.$transaction([
            prisma.wallet.update({
              where: { id: wallet.id },
              data: { balance: { increment: amount } }
            }),
            prisma.subWallet.update({
              where: { id: subWallet.id },
              data: { balance: { increment: amount } }
            })
          ])

          // Log the deposit
          console.log('Deposit logged:', {
            action: 'FLUTTERWAVE_DEPOSIT',
            details: `Deposit of ${amount} ${currency} via Flutterwave`,
            transaction_id,
            tx_ref,
            customer: customer.email,
            amount,
            currency
          })
        }
      }

      return NextResponse.json({
        status: 'success',
        data: verification
      })
    } else {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error verifying Flutterwave payment:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
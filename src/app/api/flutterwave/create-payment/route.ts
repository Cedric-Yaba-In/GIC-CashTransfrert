import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'
import { sanitizeForLog, validateEmail, validateAmount } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      amount, 
      currency, 
      customer, 
      paymentOptions,
      transactionRef,
      countryId 
    } = body

    // Validation
    if (!validateAmount(amount) || !currency || !customer || !paymentOptions || !countryId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!validateEmail(customer.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const paymentData = {
      tx_ref: transactionRef || flutterwaveService.generateTxRef(),
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
      customer: {
        email: customer.email,
        phonenumber: customer.phone,
        name: customer.name
      },
      customizations: {
        title: 'GIC CashTransfer',
        description: 'Dépôt de fonds pour transfert international',
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
      },
      payment_options: paymentOptions,
      meta: {
        consumer_id: customer.email,
        consumer_mac: transactionRef || flutterwaveService.generateTxRef()
      }
    }

    const result = await flutterwaveService.createPayment(parseInt(countryId), paymentData)
    
    if (result) {
      return NextResponse.json({
        status: 'success',
        data: result.data
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating Flutterwave payment:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
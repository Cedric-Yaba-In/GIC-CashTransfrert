import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'
import { sanitizeForLog } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('currency')

    if (!currency) {
      return NextResponse.json(
        { error: 'Currency parameter is required' },
        { status: 400 }
      )
    }

    const paymentMethods = await flutterwaveService.getPaymentMethods(currency)
    
    return NextResponse.json({
      status: 'success',
      data: paymentMethods
    })
  } catch (error) {
    console.error('Error fetching Flutterwave payment methods:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
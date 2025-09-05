import { NextRequest, NextResponse } from 'next/server'
import { ConfigService } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('currency') || 'XAF'
    const countryId = searchParams.get('countryId')

    if (!countryId) {
      return NextResponse.json({
        error: 'countryId parameter is required'
      }, { status: 400 })
    }

    // Utiliser le service Flutterwave qui gère les configurations par pays
    const { flutterwaveService } = await import('@/lib/flutterwave')
    
    try {
      const paymentMethods = await flutterwaveService.getPaymentMethods(currency)
      
      return NextResponse.json({
        status: 'success',
        data: paymentMethods,
        currency: currency,
        countryId: parseInt(countryId)
      })
    } catch (error) {
      return NextResponse.json({
        error: 'Flutterwave API test failed',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
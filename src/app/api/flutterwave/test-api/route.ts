import { NextRequest, NextResponse } from 'next/server'
import { ConfigService } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('currency') || 'XAF'

    const flutterwaveConfig = await ConfigService.getFlutterwaveConfig()
    
    console.log('Config check:', {
      hasPublicKey: !!flutterwaveConfig.publicKey,
      hasSecretKey: !!flutterwaveConfig.secretKey
    })

    if (!flutterwaveConfig.secretKey) {
      return NextResponse.json({
        error: 'No secret key configured'
      })
    }

    const response = await fetch(`https://api.flutterwave.com/v3/payment-methods?currency=${currency}`, {
      headers: {
        'Authorization': `Bearer ${flutterwaveConfig.secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    const responseText = await response.text()
    let responseData
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { rawResponse: responseText }
    }

    return NextResponse.json({
      status: response.status,
      data: responseData,
      currency: currency
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    })
  }
}
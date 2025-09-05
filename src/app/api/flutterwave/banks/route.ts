import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'

export const dynamic = 'force-dynamic'
import { sanitizeForLog, sanitizeInput } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const countryId = searchParams.get('countryId')

    if (!country || !countryId) {
      return NextResponse.json(
        { error: 'Country and countryId parameters are required' },
        { status: 400 }
      )
    }

    const sanitizedCountry = sanitizeInput(country)
    const banks = await flutterwaveService.getBanks(parseInt(countryId), sanitizedCountry)
    
    return NextResponse.json({
      status: 'success',
      data: banks
    })
  } catch (error) {
    console.error('Error fetching banks:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
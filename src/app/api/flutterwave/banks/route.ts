import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'

export const dynamic = 'force-dynamic'
import { sanitizeForLog, sanitizeInput } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')

    if (!country) {
      return NextResponse.json(
        { error: 'Country parameter is required' },
        { status: 400 }
      )
    }

    const sanitizedCountry = sanitizeInput(country)
    const banks = await flutterwaveService.getBanks(sanitizedCountry)
    
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
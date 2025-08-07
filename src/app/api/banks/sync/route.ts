import { NextResponse } from 'next/server'
import { BankService } from '@/lib/bank-service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { countryCode } = await request.json()

    if (!countryCode) {
      return NextResponse.json({ error: 'Country code required' }, { status: 400 })
    }

    console.log(`🔄 Début synchronisation banques pour ${countryCode}`)
    
    const result = await BankService.syncAllBanks(countryCode)
    
    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${result.total} banques`,
      result: {
        total: result.total,
        sources: {
          flutterwave: result.flutterwave,
          api: result.api,
          manual: result.manual
        },
        errors: result.errors
      }
    })
  } catch (error) {
    console.error('Bank sync API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to sync banks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryCode = searchParams.get('countryCode')

    if (!countryCode) {
      return NextResponse.json({ error: 'Country code required' }, { status: 400 })
    }

    const stats = await BankService.getSyncStats(countryCode)
    
    return NextResponse.json({
      countryCode,
      ...stats
    })
  } catch (error) {
    console.error('Bank sync stats API Error:', error)
    return NextResponse.json({ error: 'Failed to get sync stats' }, { status: 500 })
  }
}
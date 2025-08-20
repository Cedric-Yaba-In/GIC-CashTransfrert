import { NextRequest, NextResponse } from 'next/server'
import { ExchangeRateService } from '@/lib/exchange-rates'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || 'USD'
    const to = searchParams.get('to')
    
    if (to) {
      const rate = await ExchangeRateService.getExchangeRate(from, to)
      return NextResponse.json({ 
        from, 
        to, 
        rate,
        timestamp: Date.now()
      })
    } else {
      const rates = await ExchangeRateService.getAllRates(from)
      return NextResponse.json({ 
        base: from, 
        rates,
        timestamp: Date.now()
      })
    }
  } catch (error) {
    console.error('Erreur API taux de change:', error)
    return NextResponse.json(
      { error: 'Impossible de récupérer les taux de change' },
      { status: 500 }
    )
  }
}
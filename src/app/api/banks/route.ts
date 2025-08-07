import { NextResponse } from 'next/server'
import { BankService } from '@/lib/bank-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryCode = searchParams.get('countryCode')
    const forceSync = searchParams.get('forceSync') === 'true'

    if (!countryCode) {
      return NextResponse.json({ error: 'Country code required' }, { status: 400 })
    }

    const banks = await BankService.getBanksByCountryWithConfig(countryCode, forceSync)
    return NextResponse.json(banks)
  } catch (error) {
    console.error('Banks API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const bankData = await request.json()
    const bank = await BankService.addBank(bankData)
    return NextResponse.json(bank)
  } catch (error) {
    console.error('Bank creation error:', error)
    return NextResponse.json({ error: 'Failed to create bank' }, { status: 500 })
  }
}
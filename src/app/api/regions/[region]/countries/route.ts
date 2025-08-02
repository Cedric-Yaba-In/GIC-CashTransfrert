import { NextResponse } from 'next/server'
import { fetchCountriesByRegion } from '@/lib/countries'

export async function GET(
  request: Request,
  { params }: { params: { region: string } }
) {
  try {
    const countries = await fetchCountriesByRegion(params.region)
    return NextResponse.json(countries)
  } catch (error) {
    console.error('Region countries API Error:', error)
    return NextResponse.json([])
  }
}
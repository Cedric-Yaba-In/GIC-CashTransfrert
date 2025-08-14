import { NextResponse } from 'next/server'
import { fetchCountriesByRegion } from '@/lib/countries'

export async function GET(
  request: Request,
  { params }: { params: { region: string } }
) {
  try {
    // Récupérer les pays depuis l'API REST Countries
    const countries = await fetchCountriesByRegion(params.region)
    return NextResponse.json(countries)
  } catch (error) {
    console.error('External countries API Error:', error)
    return NextResponse.json([])
  }
}
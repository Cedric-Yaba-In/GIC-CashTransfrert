import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { region: string } }
) {
  try {
    // Récupérer les pays activés dans la base de données pour cette région
    const countries = await prisma.country.findMany({
      where: { 
        active: true,
        region: {
          code: params.region,
          active: true
        }
      },
      include: {
        region: true
      },
      orderBy: { name: 'asc' }
    })

    // Formater les données pour le frontend
    const formattedCountries = countries.map(country => ({
      id: country.id.toString(),
      name: country.name,
      code: country.code,
      currency: country.currency,
      currencyCode: country.currencyCode,
      flag: country.flag,
      region: country.region?.name || 'Unknown',
      callingCode: country.callingCode?.replace(/^\+/, '') || ''
    }))

    return NextResponse.json(formattedCountries)
  } catch (error) {
    console.error('Region countries API Error:', error)
    return NextResponse.json([])
  }
}
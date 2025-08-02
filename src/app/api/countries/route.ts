import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchCountryData, formatCountryForDB } from '@/lib/countries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      include: {
        region: true,
        paymentMethods: {
          include: {
            paymentMethod: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(countries)
  } catch (error) {
    console.error('Countries API Error:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const { countries } = await request.json()
    
    const createdCountries = []
    
    for (const countryData of countries) {
      const formattedCountry = formatCountryForDB(countryData)
      
      // Find or create region
      const region = await prisma.region.upsert({
        where: { name: formattedCountry.region },
        update: {},
        create: {
          name: formattedCountry.region,
          code: formattedCountry.region.toLowerCase(),
          active: true
        }
      })
      
      const country = await prisma.country.upsert({
        where: { code: formattedCountry.code },
        update: {
          name: formattedCountry.name,
          currency: formattedCountry.currency,
          currencyCode: formattedCountry.currencyCode,
          flag: formattedCountry.flag,
          callingCode: formattedCountry.callingCode,
          regionId: region.id
        },
        create: {
          name: formattedCountry.name,
          code: formattedCountry.code,
          currency: formattedCountry.currency,
          currencyCode: formattedCountry.currencyCode,
          flag: formattedCountry.flag,
          callingCode: formattedCountry.callingCode,
          regionId: region.id,
          active: true
        },
      })


      
      createdCountries.push(country)
    }

    return NextResponse.json(createdCountries)
  } catch (error) {
    console.error('Countries creation error:', error)
    return NextResponse.json({ error: 'Failed to create countries' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchCountryData, formatCountryForDB } from '@/lib/countries'

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      where: { active: true },
      include: {
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
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { countryCode } = await request.json()
    
    const countryData = await fetchCountryData(countryCode)
    if (!countryData.length) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    const formattedCountry = formatCountryForDB(countryData[0])
    
    const country = await prisma.country.upsert({
      where: { code: formattedCountry.code },
      update: formattedCountry,
      create: formattedCountry,
    })

    // Create wallet for the country
    await prisma.wallet.upsert({
      where: { countryId: country.id },
      update: {},
      create: {
        countryId: country.id,
        balance: 0,
      },
    })

    return NextResponse.json(country)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create country' }, { status: 500 })
  }
}
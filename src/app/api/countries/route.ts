import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchCountryData, formatCountryForDB } from '@/lib/countries'
import { FlutterwaveService } from '@/lib/flutterwave'

async function getTotalBanksForCountries(countries: any[]) {
  let total = 0
  for (const country of countries) {
    const count = await prisma.bank.count({ where: { countryCode: country.code } })
    total += count
  }
  return total
}

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
      const regionCode = formattedCountry.region.toLowerCase().replace(/\s+/g, '-')
      const region = await prisma.region.upsert({
        where: { code: regionCode },
        update: {},
        create: {
          name: formattedCountry.region,
          code: regionCode,
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


      
      // Ne pas associer automatiquement les catégories
      // L'administrateur choisira manuellement les catégories à activer

      // Créer le wallet pour le pays
      await prisma.wallet.upsert({
        where: { countryId: country.id },
        update: {},
        create: {
          countryId: country.id,
          balance: 0,
          active: true
        }
      })
      
      createdCountries.push(country)
      
      // Synchroniser automatiquement les banques pour ce pays
      try {
        const { BankService } = require('@/lib/bank-service')
        const syncResult = await BankService.syncAllBanks(country.code)
        console.log(`${syncResult.total} banques synchronisées pour ${country.name}`)
      } catch (bankError) {
        console.error(`Erreur synchronisation banques pour ${country.name}:`, bankError)
      }
    }

    const totalBanks = createdCountries.length > 0 ? await getTotalBanksForCountries(createdCountries) : 0
    return NextResponse.json({ countries: createdCountries, banksAdded: totalBanks })
  } catch (error) {
    console.error('Countries creation error:', error)
    return NextResponse.json({ error: 'Failed to create countries' }, { status: 500 })
  }
}
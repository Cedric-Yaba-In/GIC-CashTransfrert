import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'
import { prisma } from '@/lib/prisma'
import { sanitizeForLog, sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { countryCode } = body

    if (!countryCode) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      )
    }

    const sanitizedCountryCode = sanitizeInput(countryCode)

    // Vérifier que le pays existe
    const country = await prisma.country.findUnique({
      where: { code: sanitizedCountryCode }
    })

    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      )
    }

    // Récupérer les banques depuis Flutterwave
    const flutterwaveBanks = await flutterwaveService.getBanks(sanitizedCountryCode)
    
    if (!flutterwaveBanks || flutterwaveBanks.length === 0) {
      return NextResponse.json(
        { error: 'No banks found for this country' },
        { status: 404 }
      )
    }

    let syncedCount = 0
    let updatedCount = 0

    // Synchroniser chaque banque
    for (const bank of flutterwaveBanks) {
      try {
        const existingBank = await prisma.bank.findUnique({
          where: {
            code_countryCode: {
              code: bank.code,
              countryCode: sanitizedCountryCode
            }
          }
        })

        if (existingBank) {
          // Mettre à jour la banque existante
          await prisma.bank.update({
            where: { id: existingBank.id },
            data: {
              name: bank.name,
              source: 'FLUTTERWAVE',
              active: true
            }
          })
          updatedCount++
        } else {
          // Créer une nouvelle banque
          await prisma.bank.create({
            data: {
              name: bank.name,
              code: bank.code,
              countryCode: sanitizedCountryCode,
              source: 'FLUTTERWAVE',
              active: true
            }
          })
          syncedCount++
        }
      } catch (error) {
        console.error(`Error syncing bank ${bank.code}:`, sanitizeForLog(error))
        continue
      }
    }

    return NextResponse.json({
      status: 'success',
      message: `Synchronized ${syncedCount} new banks and updated ${updatedCount} existing banks`,
      data: {
        synced: syncedCount,
        updated: updatedCount,
        total: flutterwaveBanks.length
      }
    })
  } catch (error) {
    console.error('Error syncing banks:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getFlutterwaveConfig } from '@/lib/flutterwave'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId')

    if (!countryId) {
      return NextResponse.json({ error: 'Country ID is required' }, { status: 400 })
    }

    // Récupérer la configuration Flutterwave pour le pays de RÉCEPTION
    const config = await getFlutterwaveConfig(countryId)
    if (!config) {
      return NextResponse.json({ error: 'Flutterwave not configured for receiver country' }, { status: 404 })
    }

    // Appeler l'API Flutterwave pour récupérer les banques du pays de réception
    const response = await fetch(`https://api.flutterwave.com/v3/banks/${config.countryCode}`, {
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch banks from Flutterwave')
    }

    const data = await response.json()
    
    if (data.status === 'success') {
      return NextResponse.json(data.data)
    } else {
      return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error fetching Flutterwave banks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
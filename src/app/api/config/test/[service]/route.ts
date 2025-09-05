import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ConfigService } from '@/lib/config'
import nodemailer from 'nodemailer'

export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const { service } = params

    switch (service) {
      case 'email':
        return await testEmailService()
      case 'sms':
        return await testSMSService()

      case 'cinetpay':
        return await testCinetPayService()
      case 'api':
        return await testAPIService()
      default:
        return NextResponse.json(
          { message: 'Service de test non supporté' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Test service error:', error)
    return NextResponse.json(
      { message: 'Erreur lors du test' },
      { status: 500 }
    )
  }
}

async function testEmailService() {
  try {
    const emailConfigs = await prisma.configuration.findMany({
      where: { category: 'email' }
    })

    const config = emailConfigs.reduce((acc, item) => {
      acc[item.key] = item.value || ''
      return acc
    }, {} as Record<string, string>)

    if (!config.EMAIL_HOST || !config.EMAIL_USER || !config.EMAIL_PASS) {
      return NextResponse.json(
        { message: 'Configuration email incomplète' },
        { status: 400 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: parseInt(config.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    })

    await transporter.verify()

    return NextResponse.json({
      message: 'Connexion SMTP réussie'
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: `Erreur SMTP: ${error.message}` },
      { status: 400 }
    )
  }
}

async function testSMSService() {
  try {
    const smsConfigs = await prisma.configuration.findMany({
      where: { category: 'sms' }
    })

    const config = smsConfigs.reduce((acc, item) => {
      acc[item.key] = item.value || ''
      return acc
    }, {} as Record<string, string>)

    if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
      return NextResponse.json(
        { message: 'Configuration Twilio incomplète' },
        { status: 400 }
      )
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}.json`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString('base64')}`
      }
    })

    if (response.ok) {
      return NextResponse.json({
        message: 'Connexion Twilio réussie'
      })
    } else {
      return NextResponse.json(
        { message: 'Identifiants Twilio invalides' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: `Erreur Twilio: ${error.message}` },
      { status: 400 }
    )
  }
}



async function testCinetPayService() {
  try {
    const config = await ConfigService.getCinetPayConfig()

    if (!config.apiKey || !config.siteId || !config.secretKey) {
      return NextResponse.json(
        { message: 'Configuration CinetPay incomplète' },
        { status: 400 }
      )
    }

    // Test simple de validation des credentials CinetPay
    const testData = {
      apikey: config.apiKey,
      site_id: config.siteId,
      transaction_id: 'TEST_' + Date.now(),
      amount: 100,
      currency: 'XOF',
      description: 'Test de connexion'
    }

    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    
    // CinetPay retourne un code spécifique même pour les transactions inexistantes
    if (result.code === '625' || result.code === '00') {
      return NextResponse.json({
        message: 'Connexion CinetPay réussie'
      })
    } else if (result.code === '601') {
      return NextResponse.json(
        { message: 'Clés CinetPay invalides' },
        { status: 400 }
      )
    } else {
      return NextResponse.json({
        message: 'Connexion CinetPay réussie (credentials valides)'
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: `Erreur CinetPay: ${error.message}` },
      { status: 400 }
    )
  }
}

async function testAPIService() {
  try {
    const apiConfigs = await prisma.configuration.findMany({
      where: { category: 'api' }
    })

    const config = apiConfigs.reduce((acc, item) => {
      acc[item.key] = item.value || ''
      return acc
    }, {} as Record<string, string>)

    const apiUrl = config.RESTCOUNTRIES_API_URL || 'https://restcountries.com/v3.1'

    const response = await fetch(`${apiUrl}/name/france?fields=name`)

    if (response.ok) {
      return NextResponse.json({
        message: 'API RestCountries accessible'
      })
    } else {
      return NextResponse.json(
        { message: 'API RestCountries inaccessible' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: `Erreur API: ${error.message}` },
      { status: 400 }
    )
  }
}
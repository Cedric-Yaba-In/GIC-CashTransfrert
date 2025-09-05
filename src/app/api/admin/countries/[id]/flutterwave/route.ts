import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { publicKey, secretKey, encryptionKey, webhookHash } = await request.json()
    const countryId = parseInt(params.id)

    if (!publicKey || !secretKey || !encryptionKey) {
      return NextResponse.json({ error: 'Clés API requises (publique, secrète et encryption)' }, { status: 400 })
    }

    // Vérifier que le pays existe
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    })

    if (!country) {
      return NextResponse.json({ error: 'Pays non trouvé' }, { status: 404 })
    }

    // Récupérer ou créer la méthode Flutterwave
    let flutterwaveMethod = await prisma.paymentMethod.findFirst({
      where: { type: 'FLUTTERWAVE' }
    })

    if (!flutterwaveMethod) {
      flutterwaveMethod = await prisma.paymentMethod.create({
        data: {
          name: 'Flutterwave',
          type: 'FLUTTERWAVE',
          category: 'HYBRID',
          active: true,
          isGlobal: true
        }
      })
    }

    // Configuration API pour ce pays
    const apiConfig = {
      publicKey,
      secretKey,
      encryptionKey,
      webhookHash: webhookHash || '',
      baseUrl: 'https://api.flutterwave.com/v3'
    }

    // Créer ou mettre à jour l'association pays-méthode
    const countryPaymentMethod = await prisma.countryPaymentMethod.upsert({
      where: {
        countryId_paymentMethodId: {
          countryId,
          paymentMethodId: flutterwaveMethod.id
        }
      },
      update: {
        apiConfig: JSON.stringify(apiConfig),
        active: true
      },
      create: {
        countryId,
        paymentMethodId: flutterwaveMethod.id,
        apiConfig: JSON.stringify(apiConfig),
        active: true,
        fees: 0
      }
    })

    // S'assurer que le wallet du pays existe
    const wallet = await prisma.wallet.upsert({
      where: { countryId },
      update: {},
      create: {
        countryId,
        balance: 0,
        active: true
      }
    })

    // Créer le sous-wallet Flutterwave
    await prisma.subWallet.upsert({
      where: { countryPaymentMethodId: countryPaymentMethod.id },
      update: {
        active: true,
        readOnly: true
      },
      create: {
        walletId: wallet.id,
        countryPaymentMethodId: countryPaymentMethod.id,
        balance: 0,
        active: true,
        readOnly: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Flutterwave configuré pour ${country.name}`
    })

  } catch (error) {
    console.error('Configure Flutterwave error:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la configuration' 
    }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const countryId = parseInt(params.id)

    const countryPaymentMethod = await prisma.countryPaymentMethod.findFirst({
      where: {
        countryId,
        paymentMethod: { type: 'FLUTTERWAVE' }
      },
      include: {
        country: true,
        paymentMethod: true
      }
    })

    if (!countryPaymentMethod?.apiConfig) {
      return NextResponse.json({ configured: false })
    }

    try {
      const config = JSON.parse(countryPaymentMethod.apiConfig)
      
      return NextResponse.json({
        configured: true,
        publicKey: config.publicKey || '',
        secretKey: config.secretKey || '',
        encryptionKey: config.encryptionKey || '',
        webhookHash: config.webhookHash || '',
        hasSecretKey: !!config.secretKey,
        hasEncryptionKey: !!config.encryptionKey,
        hasWebhookHash: !!config.webhookHash
      })
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ configured: false })
    }

  } catch (error) {
    console.error('Get Flutterwave config error:', error)
    return NextResponse.json({ configured: false })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const countryId = parseInt(params.id)

    const countryPaymentMethod = await prisma.countryPaymentMethod.findFirst({
      where: {
        countryId,
        paymentMethod: { type: 'FLUTTERWAVE' }
      },
      include: { subWallet: true }
    })

    if (countryPaymentMethod) {
      // Supprimer le sous-wallet
      if (countryPaymentMethod.subWallet) {
        await prisma.subWallet.delete({
          where: { id: countryPaymentMethod.subWallet.id }
        })
      }

      // Supprimer l'association
      await prisma.countryPaymentMethod.delete({
        where: { id: countryPaymentMethod.id }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete Flutterwave config error:', error)
    return NextResponse.json({ error: 'Erreur de suppression' }, { status: 500 })
  }
}
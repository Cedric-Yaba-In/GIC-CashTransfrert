import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeForLog } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({ error: 'Référence manquante' }, { status: 400 })
    }

    // Essayer d'abord avec la référence exacte, puis avec la référence de base
    const baseRef = reference.includes('_') ? reference.substring(0, reference.lastIndexOf('_')) : reference
    console.log('Tracking transaction with reference:', reference, 'baseRef:', baseRef)
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { reference: reference },
          { reference: baseRef }
        ]
      },
      select: {
        id: true,
        reference: true,
        status: true,
        senderName: true,
        receiverName: true,
        amount: true,
        totalAmount: true,
        createdAt: true,
        updatedAt: true,
        senderCountry: {
          select: {
            name: true,
            currency: true,
            currencyCode: true
          }
        },
        receiverCountry: {
          select: {
            name: true,
            currency: true,
            currencyCode: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error tracking transaction:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
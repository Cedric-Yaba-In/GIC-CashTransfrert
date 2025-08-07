import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentConfigService } from '@/lib/payment-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      distinct: ['id'],
      orderBy: { name: 'asc' },
      include: {
        countries: true,
        bank: true
      }
    })

    // Ajouter le statut de configuration pour chaque méthode
    const methodsWithConfig = await Promise.all(
      paymentMethods.map(async (method) => {
        const isConfigured = await PaymentConfigService.isConfigured(method.type)
        return {
          ...method,
          isConfigured
        }
      })
    )

    return NextResponse.json(methodsWithConfig)
  } catch (error) {
    console.error('Payment methods API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, category, subType, bankId, countryCode, minAmount, maxAmount, active } = body

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        name,
        type,
        category: category || 'HYBRID',
        subType,
        bankId,
        minAmount: parseFloat(minAmount) || 0,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        active: active ?? true
      },
      include: {
        countries: true,
        bank: true
      }
    })

    // Si countryCode est fourni, créer l'association avec le pays
    if (countryCode) {
      const country = await prisma.country.findUnique({
        where: { code: countryCode }
      })

      if (country) {
        await prisma.countryPaymentMethod.create({
          data: {
            countryId: country.id,
            paymentMethodId: paymentMethod.id,
            active: true,
            fees: 0
          }
        })
      }
    }

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error('Create payment method error:', error)
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentConfigService } from '@/lib/payment-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' },
      include: {
        countries: true,
        bank: true
      }
    })

    // Filtrer pour ne garder que les méthodes de base disponibles pour association
    const baseMethods = []
    const processedTypes = new Set()

    for (const method of paymentMethods) {
      // Éviter les doublons par type
      if (processedTypes.has(method.type)) continue

      // Vérifier si la méthode est configurée
      const isConfigured = await PaymentConfigService.isConfigured(method.type)
      if (!isConfigured || !method.active) continue

      // Pour les méthodes globales comme Flutterwave et CinetPay, toujours les inclure
      if (method.type === 'FLUTTERWAVE' || method.type === 'CINETPAY') {
        baseMethods.push({
          ...method,
          isConfigured: true,
          isGlobal: true
        })
        processedTypes.add(method.type)
        continue
      }

      // Pour les autres méthodes, prendre la méthode de base (sans association pays)
      const baseMethod = paymentMethods.find(m => 
        m.type === method.type && 
        (!m.countries || m.countries.length === 0)
      )

      if (baseMethod) {
        baseMethods.push({
          ...baseMethod,
          isConfigured: true,
          isGlobal: false
        })
        processedTypes.add(method.type)
      }
    }

    return NextResponse.json(baseMethods)
  } catch (error) {
    console.error('Base payment methods API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch base payment methods' }, { status: 500 })
  }
}
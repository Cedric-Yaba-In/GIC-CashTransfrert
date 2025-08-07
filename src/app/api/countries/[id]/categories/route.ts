import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Associer des catégories à un pays
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const countryId = parseInt(params.id)
    const { categories } = await request.json()
    
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    })
    
    if (!country) {
      return NextResponse.json({ error: 'Pays non trouvé' }, { status: 404 })
    }

    const associations = []
    
    for (const categoryId of categories) {
      // Récupérer la méthode globale
      const globalMethod = await prisma.paymentMethod.findUnique({
        where: { id: categoryId }
      })
      
      if (!globalMethod) continue

      // Pour les méthodes globales, on réutilise directement
      // Pour les locales, on crée une instance spécifique
      let countryMethod
      if (globalMethod.isGlobal) {
        countryMethod = globalMethod // Réutiliser la méthode globale
      } else {
        countryMethod = await prisma.paymentMethod.create({
          data: {
            name: `${globalMethod.name} ${country.code}`,
            type: globalMethod.type,
            category: globalMethod.category,
            subType: globalMethod.subType,
            minAmount: globalMethod.minAmount,
            maxAmount: globalMethod.maxAmount,
            active: true,
            isGlobal: false
          }
        })
      }

      // Associer au pays
      const association = await prisma.countryPaymentMethod.create({
        data: {
          countryId: country.id,
          paymentMethodId: countryMethod.id,
          active: true,
          fees: globalMethod.category === 'HYBRID' ? 5 : 
                globalMethod.category === 'MOBILE_MONEY' ? 2 : 0
        }
      })

      associations.push(association)
    }

    return NextResponse.json({ 
      message: `${associations.length} catégories associées au pays ${country.name}`,
      associations 
    })
  } catch (error) {
    console.error('Erreur association catégories:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'association' }, { status: 500 })
  }
}

// Récupérer les catégories disponibles et associées
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const countryId = parseInt(params.id)
    
    // Catégories de base disponibles
    const globalCategories = await prisma.paymentMethod.findMany({
      where: {
        OR: [
          { name: 'Flutterwave' },
          { name: 'Bank Transfer' },
          { name: 'Orange Money' },
          { name: 'MTN Mobile Money' }
        ]
      }
    })

    // Catégories déjà associées au pays
    const associatedCategories = await prisma.countryPaymentMethod.findMany({
      where: { countryId },
      include: {
        paymentMethod: true
      }
    })

    return NextResponse.json({
      available: globalCategories,
      associated: associatedCategories
    })
  } catch (error) {
    console.error('Erreur récupération catégories:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 })
  }
}
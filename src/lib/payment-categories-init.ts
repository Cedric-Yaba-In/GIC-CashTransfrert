// Service d'initialisation des catégories de méthodes de paiement
import { prisma } from '@/lib/prisma'

export class PaymentCategoriesInitService {
  
  static async initializeGlobalCategories() {
    console.log('🔧 Initialisation des catégories globales de paiement...')
    
    // Vérifier si les catégories existent déjà
    const existingCount = await prisma.paymentMethod.count()
    if (existingCount > 0) {
      console.log('ℹ️ Catégories déjà existantes')
      return
    }
    
    const categories = [
      {
        name: 'Flutterwave',
        type: 'FLUTTERWAVE',
        category: 'HYBRID',
        subType: 'FLUTTERWAVE',
        minAmount: 1,
        maxAmount: 10000,
        active: true,
        isGlobal: true
      },
      {
        name: 'Bank Transfer',
        type: 'BANK_TRANSFER',
        category: 'BANK_TRANSFER',
        subType: 'GLOBAL',
        minAmount: 10,
        maxAmount: null,
        active: true,
        isGlobal: false
      },
      {
        name: 'Orange Money',
        type: 'MOBILE_MONEY',
        category: 'MOBILE_MONEY',
        subType: 'ORANGE',
        minAmount: 1,
        maxAmount: 5000,
        active: false,
        isGlobal: false
      },
      {
        name: 'MTN Mobile Money',
        type: 'MOBILE_MONEY',
        category: 'MOBILE_MONEY',
        subType: 'MTN',
        minAmount: 1,
        maxAmount: 5000,
        active: false,
        isGlobal: false
      }
    ]
    
    const created = []
    for (const category of categories) {
      const result = await prisma.paymentMethod.create({
        data: category as any
      })
      created.push(result)
    }

    console.log('✅ Catégories globales initialisées')
    return created
  }

  static async associateCountryToCategories(countryId: number, countryCode: string, region: string) {
    console.log(`🔗 Association des catégories au pays ${countryCode}...`)
    
    // Récupérer les catégories de base (pas de doublons)
    const globalMethods = await prisma.paymentMethod.findMany({
      where: {
        OR: [
          { name: 'Flutterwave' },
          { name: 'Bank Transfer' },
          { name: 'Orange Money' },
          { name: 'MTN Mobile Money' }
        ]
      }
    })

    const associations = []

    for (const method of globalMethods) {
      // Vérifier si la méthode existe déjà pour ce pays
      let countryMethod
      
      // Vérifier si déjà associé
      const existingAssociation = await prisma.countryPaymentMethod.findFirst({
        where: {
          countryId: countryId,
          paymentMethod: {
            category: method.category
          }
        }
      })
      
      if (existingAssociation) {
        continue // Déjà associé
      }
      
      // Pour les méthodes globales, on réutilise directement
      // Pour les locales, on crée une instance spécifique
      if (method.isGlobal) {
        countryMethod = method // Réutiliser la méthode globale
      } else {
        countryMethod = await prisma.paymentMethod.create({
          data: {
            name: `${method.name} ${countryCode}`,
            type: method.type,
            category: method.category,
            subType: method.subType,
            minAmount: method.minAmount,
            maxAmount: method.maxAmount,
            active: method.category === 'BANK_TRANSFER' ? true : 
                    (region === 'Africa' && method.category === 'MOBILE_MONEY' ? false : false),
            isGlobal: false
          }
        })
      }

      // Associer au pays
      const association = await prisma.countryPaymentMethod.upsert({
        where: {
          countryId_paymentMethodId: {
            countryId: countryId,
            paymentMethodId: countryMethod.id
          }
        },
        update: {},
        create: {
          countryId: countryId,
          paymentMethodId: countryMethod.id,
          active: countryMethod.active,
          fees: method.category === 'HYBRID' ? 5 : 
                method.category === 'MOBILE_MONEY' ? 2 : 0
        }
      })

      associations.push(association)
    }

    console.log(`✅ ${associations.length} catégories associées au pays ${countryCode}`)
    return associations
  }
}
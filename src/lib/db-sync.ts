import { PrismaClient } from '@prisma/client'
import { hashPassword } from './auth'

const prisma = new PrismaClient()

export async function syncDatabase() {
  try {
    console.log('🔄 Synchronisation de la base de données...')

    // Check if basic data exists
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@gicpromoteltd.com' }
    })

    if (adminExists) {
      console.log('✅ Base de données déjà synchronisée')
      return
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123')
    await prisma.user.create({
      data: {
        email: 'admin@gicpromoteltd.com',
        password: hashedPassword,
        name: 'Administrateur GIC',
        role: 'ADMIN',
      },
    })

    // Create payment methods
    await prisma.paymentMethod.createMany({
      data: [
        {
          name: 'Flutterwave',
          type: 'FLUTTERWAVE',
          minAmount: 10,
          maxAmount: 10000,
          active: true,
        },
        {
          name: 'Mobile Money',
          type: 'MOBILE_MONEY',
          minAmount: 5,
          maxAmount: 5000,
          active: true,
        },
        {
          name: 'Virement bancaire',
          type: 'BANK_TRANSFER',
          minAmount: 50,
          maxAmount: 50000,
          active: true,
        },
        {
          name: 'Carte bancaire',
          type: 'API',
          minAmount: 1,
          maxAmount: 20000,
          active: true,
        }
      ],
      skipDuplicates: true
    })

    // Create regions (will be populated from restcountries API)
    await prisma.region.createMany({
      data: [
        { name: 'Africa', code: 'africa', active: true },
        { name: 'Europe', code: 'europe', active: true },
        { name: 'Asia', code: 'asia', active: true },
        { name: 'Americas', code: 'americas', active: true },
        { name: 'Oceania', code: 'oceania', active: true },
      ],
      skipDuplicates: true
    })

    console.log('✅ Base de données synchronisée avec succès!')
    console.log('📝 Utilisateur admin créé: admin@gicpromoteltd.com / admin123')
    console.log('💳 Moyens de paiement créés: 4')
    console.log('🌍 Régions créées: 5')
    console.log('ℹ️  Les pays seront chargés dynamiquement depuis restcountries.com')

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
  } finally {
    await prisma.$disconnect()
  }
}
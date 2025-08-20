import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPaymentCategories() {
  console.log('🌱 Seeding payment categories...')

  try {
    // Créer les méthodes de paiement par catégorie pour quelques pays de test
    const countries = await prisma.country.findMany({
      where: {
        code: { in: ['FR', 'SN', 'CI', 'CM'] }
      }
    })

    for (const country of countries) {
      console.log(`📍 Setting up payment methods for ${country.name} (${country.code})`)

      // 1. Méthode Hybride - Flutterwave
      let flutterwaveMethod = await prisma.paymentMethod.findFirst({
        where: { name: `Flutterwave ${country.code}` }
      })
      
      if (!flutterwaveMethod) {
        flutterwaveMethod = await prisma.paymentMethod.create({
          data: {
            name: `Flutterwave ${country.code}`,
            type: 'FLUTTERWAVE',
            category: 'HYBRID',
            subType: 'FLUTTERWAVE',
            minAmount: 1,
            maxAmount: 10000,
            active: true
          }
        })
      }

      // Associer au pays
      await prisma.countryPaymentMethod.upsert({
        where: {
          countryId_paymentMethodId: {
            countryId: country.id,
            paymentMethodId: flutterwaveMethod.id
          }
        },
        update: {},
        create: {
          countryId: country.id,
          paymentMethodId: flutterwaveMethod.id,
          active: true,
          fees: 5
        }
      })

      // 2. Méthode Mobile Money (pour pays africains)
      if (['SN', 'CI', 'CM'].includes(country.code)) {
        // Orange Money
        let orangeMethod = await prisma.paymentMethod.findFirst({
          where: { name: `Orange Money ${country.code}` }
        })
        
        if (!orangeMethod) {
          orangeMethod = await prisma.paymentMethod.create({
            data: {
              name: `Orange Money ${country.code}`,
              type: 'MOBILE_MONEY',
              category: 'MOBILE_MONEY',
              subType: 'ORANGE',
              minAmount: 1,
              maxAmount: 5000,
              active: false
            }
          })
        }

        await prisma.countryPaymentMethod.upsert({
          where: {
            countryId_paymentMethodId: {
              countryId: country.id,
              paymentMethodId: orangeMethod.id
            }
          },
          update: {},
          create: {
            countryId: country.id,
            paymentMethodId: orangeMethod.id,
            active: false,
            fees: 2
          }
        })

        // MTN Mobile Money
        let mtnMethod = await prisma.paymentMethod.findFirst({
          where: { name: `MTN Mobile Money ${country.code}` }
        })
        
        if (!mtnMethod) {
          mtnMethod = await prisma.paymentMethod.create({
            data: {
              name: `MTN Mobile Money ${country.code}`,
              type: 'MOBILE_MONEY',
              category: 'MOBILE_MONEY',
              subType: 'MTN',
              minAmount: 1,
              maxAmount: 5000,
              active: false
            }
          })
        }

        await prisma.countryPaymentMethod.upsert({
          where: {
            countryId_paymentMethodId: {
              countryId: country.id,
              paymentMethodId: mtnMethod.id
            }
          },
          update: {},
          create: {
            countryId: country.id,
            paymentMethodId: mtnMethod.id,
            active: false,
            fees: 2
          }
        })
      }

      // 3. Méthode Transfert Bancaire Global
      let bankTransferMethod = await prisma.paymentMethod.findFirst({
        where: { name: `Bank Transfer ${country.code}` }
      })
      
      if (!bankTransferMethod) {
        bankTransferMethod = await prisma.paymentMethod.create({
          data: {
            name: `Bank Transfer ${country.code}`,
            type: 'BANK_TRANSFER',
            category: 'BANK_TRANSFER',
            subType: 'GLOBAL',
            minAmount: 10,
            maxAmount: null,
            active: true
          }
        })
      }

      await prisma.countryPaymentMethod.upsert({
        where: {
          countryId_paymentMethodId: {
            countryId: country.id,
            paymentMethodId: bankTransferMethod.id
          }
        },
        update: {},
        create: {
          countryId: country.id,
          paymentMethodId: bankTransferMethod.id,
          active: true,
          fees: 0
        }
      })

      console.log(`✅ Payment methods configured for ${country.name}`)
    }

    console.log('🎉 Payment categories seeding completed!')

  } catch (error) {
    console.error('❌ Error seeding payment categories:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedPaymentCategories()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedPaymentCategories }
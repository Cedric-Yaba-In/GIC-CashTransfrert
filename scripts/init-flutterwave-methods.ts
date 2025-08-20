import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initFlutterwaveMethods() {
  try {
    console.log('Initializing Flutterwave payment methods...')

    // Créer la méthode de paiement Flutterwave globale
    const flutterwaveMethod = await prisma.paymentMethod.upsert({
      where: { id: 1 }, // Assuming ID 1 for Flutterwave
      update: {
        name: 'Flutterwave',
        type: 'FLUTTERWAVE',
        category: 'HYBRID',
        isGlobal: true,
        active: true,
        minAmount: 1,
        maxAmount: 1000000
      },
      create: {
        name: 'Flutterwave',
        type: 'FLUTTERWAVE',
        category: 'HYBRID',
        isGlobal: true,
        active: true,
        minAmount: 1,
        maxAmount: 1000000
      }
    })

    console.log('Flutterwave payment method created/updated:', flutterwaveMethod.id)

    // Récupérer tous les pays actifs
    const countries = await prisma.country.findMany({
      where: { active: true }
    })

    console.log(`Found ${countries.length} active countries`)

    // Associer Flutterwave à tous les pays
    for (const country of countries) {
      try {
        const countryPaymentMethod = await prisma.countryPaymentMethod.upsert({
          where: {
            countryId_paymentMethodId: {
              countryId: country.id,
              paymentMethodId: flutterwaveMethod.id
            }
          },
          update: {
            active: true,
            minAmount: 1,
            maxAmount: 1000000,
            fees: 0
          },
          create: {
            countryId: country.id,
            paymentMethodId: flutterwaveMethod.id,
            active: true,
            minAmount: 1,
            maxAmount: 1000000,
            fees: 0
          }
        })

        console.log(`Associated Flutterwave with ${country.name} (${country.code})`)

        // Créer ou mettre à jour le portefeuille du pays
        const wallet = await prisma.wallet.upsert({
          where: { countryId: country.id },
          update: { active: true },
          create: {
            countryId: country.id,
            balance: 10000, // Balance initiale pour les tests
            active: true
          }
        })

        // Créer le sous-portefeuille pour Flutterwave
        await prisma.subWallet.upsert({
          where: { countryPaymentMethodId: countryPaymentMethod.id },
          update: {
            balance: 10000,
            active: true
          },
          create: {
            walletId: wallet.id,
            countryPaymentMethodId: countryPaymentMethod.id,
            balance: 10000,
            active: true
          }
        })

        console.log(`Created/updated wallet and sub-wallet for ${country.name}`)
      } catch (error) {
        console.error(`Error processing country ${country.name}:`, error)
        continue
      }
    }

    console.log('Flutterwave initialization completed successfully!')
  } catch (error) {
    console.error('Error initializing Flutterwave methods:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initFlutterwaveMethods()
    .then(() => {
      console.log('Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

export { initFlutterwaveMethods }
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateFlutterwaveConfig() {
  try {
    console.log('🔄 Vérification des configurations Flutterwave par pays...')

    // Trouver tous les pays qui ont Flutterwave associé
    const flutterwaveAssociations = await prisma.countryPaymentMethod.findMany({
      where: {
        paymentMethod: {
          type: 'FLUTTERWAVE'
        }
      },
      include: {
        country: true,
        paymentMethod: true
      }
    })

    console.log(`📊 ${flutterwaveAssociations.length} associations Flutterwave trouvées`)

    // Vérifier chaque association
    for (const association of flutterwaveAssociations) {
      if (association.apiConfig) {
        try {
          const config = JSON.parse(association.apiConfig)
          if (config.publicKey && config.secretKey) {
            console.log(`✅ ${association.country.name} - Configuration OK`)
          } else {
            console.log(`⚠️  ${association.country.name} - Configuration incomplète`)
          }
        } catch (error) {
          console.log(`❌ ${association.country.name} - Configuration invalide`)
        }
      } else {
        console.log(`❌ ${association.country.name} - Aucune configuration API`)
      }
    }

    console.log('🎉 Vérification terminée!')
    console.log('💡 Les clés API Flutterwave sont déjà configurées par pays dans countryPaymentMethod.apiConfig')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la vérification si le script est appelé directement
if (require.main === module) {
  migrateFlutterwaveConfig()
}

export { migrateFlutterwaveConfig }
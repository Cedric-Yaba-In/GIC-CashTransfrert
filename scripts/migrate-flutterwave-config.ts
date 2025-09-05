import { PrismaClient } from '@prisma/client'
import { ConfigService } from '../src/lib/config'

const prisma = new PrismaClient()

async function migrateFlutterwaveConfig() {
  try {
    console.log('🔄 Migration de la configuration Flutterwave...')

    // Récupérer la configuration globale existante
    const globalConfig = await ConfigService.getFlutterwaveConfig()
    
    if (!globalConfig.publicKey || !globalConfig.secretKey) {
      console.log('❌ Aucune configuration Flutterwave globale trouvée')
      return
    }

    console.log('✅ Configuration globale trouvée')

    // Trouver tous les pays qui ont déjà Flutterwave associé
    const existingFlutterwaveAssociations = await prisma.countryPaymentMethod.findMany({
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

    console.log(`📊 ${existingFlutterwaveAssociations.length} associations Flutterwave trouvées`)

    // Migrer chaque association
    for (const association of existingFlutterwaveAssociations) {
      const apiConfig = {
        publicKey: globalConfig.publicKey,
        secretKey: globalConfig.secretKey,
        webhookHash: globalConfig.webhookHash || '',
        baseUrl: 'https://api.flutterwave.com/v3'
      }

      await prisma.countryPaymentMethod.update({
        where: { id: association.id },
        data: {
          apiConfig: JSON.stringify(apiConfig)
        }
      })

      console.log(`✅ Configuration migrée pour ${association.country.name}`)
    }

    console.log('🎉 Migration terminée avec succès!')
    console.log('⚠️  Vous pouvez maintenant supprimer la configuration globale Flutterwave si souhaité')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateFlutterwaveConfig()
}

export { migrateFlutterwaveConfig }
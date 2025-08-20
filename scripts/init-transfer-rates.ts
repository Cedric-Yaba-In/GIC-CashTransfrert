import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initTransferRates() {
  try {
    console.log('Initializing transfer rates...')

    // Créer le taux global par défaut
    const globalRate = await prisma.transferRate.upsert({
      where: { id: 1 },
      update: {
        name: 'Taux Global Standard',
        description: 'Taux de transfert par défaut pour tous les pays',
        baseFee: 5.00,
        percentageFee: 2.5,
        minAmount: 1,
        maxAmount: 10000,
        exchangeRateMargin: 2.0,
        active: true,
        isDefault: true
      },
      create: {
        name: 'Taux Global Standard',
        description: 'Taux de transfert par défaut pour tous les pays',
        baseFee: 5.00,
        percentageFee: 2.5,
        minAmount: 1,
        maxAmount: 10000,
        exchangeRateMargin: 2.0,
        active: true,
        isDefault: true
      }
    })

    console.log('Global rate created/updated:', globalRate.id)

    // Créer des taux spécifiques pour certains corridors populaires
    const corridors = [
      {
        senderCode: 'FR',
        receiverCode: 'CI',
        baseFee: 3.00,
        percentageFee: 1.5,
        exchangeRateMargin: 1.5
      },
      {
        senderCode: 'FR',
        receiverCode: 'SN',
        baseFee: 3.00,
        percentageFee: 1.5,
        exchangeRateMargin: 1.5
      },
      {
        senderCode: 'US',
        receiverCode: 'NG',
        baseFee: 4.00,
        percentageFee: 2.0,
        exchangeRateMargin: 1.8
      },
      {
        senderCode: 'GB',
        receiverCode: 'GH',
        baseFee: 4.00,
        percentageFee: 2.0,
        exchangeRateMargin: 1.8
      }
    ]

    for (const corridor of corridors) {
      try {
        // Trouver les pays
        const [senderCountry, receiverCountry] = await Promise.all([
          prisma.country.findUnique({ where: { code: corridor.senderCode } }),
          prisma.country.findUnique({ where: { code: corridor.receiverCode } })
        ])

        if (senderCountry && receiverCountry) {
          await prisma.transferCorridor.upsert({
            where: {
              senderCountryId_receiverCountryId: {
                senderCountryId: senderCountry.id,
                receiverCountryId: receiverCountry.id
              }
            },
            update: {
              baseFee: corridor.baseFee,
              percentageFee: corridor.percentageFee,
              exchangeRateMargin: corridor.exchangeRateMargin,
              active: true
            },
            create: {
              senderCountryId: senderCountry.id,
              receiverCountryId: receiverCountry.id,
              baseFee: corridor.baseFee,
              percentageFee: corridor.percentageFee,
              exchangeRateMargin: corridor.exchangeRateMargin,
              active: true
            }
          })

          console.log(`Corridor ${corridor.senderCode} → ${corridor.receiverCode} created/updated`)
        }
      } catch (error) {
        console.error(`Error creating corridor ${corridor.senderCode} → ${corridor.receiverCode}:`, error)
      }
    }

    console.log('Transfer rates initialization completed!')
  } catch (error) {
    console.error('Error initializing transfer rates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initTransferRates()
    .then(() => {
      console.log('Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

export { initTransferRates }
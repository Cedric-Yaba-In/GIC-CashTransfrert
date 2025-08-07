import { PrismaClient } from '@prisma/client'
import { bankSeeds } from './bank-seeds'

const prisma = new PrismaClient()

async function seedBanks() {
  console.log('🏦 Seeding banks...')
  
  try {
    for (const bankData of bankSeeds) {
      await prisma.bank.upsert({
        where: {
          code_countryCode: {
            code: bankData.code,
            countryCode: bankData.countryCode
          }
        },
        update: {
          name: bankData.name,
          logo: bankData.logo,
          website: bankData.website,
          swiftCode: bankData.swiftCode,
          routingNumber: bankData.routingNumber,
          source: bankData.source,
          active: true
        },
        create: {
          name: bankData.name,
          code: bankData.code,
          countryCode: bankData.countryCode,
          logo: bankData.logo,
          website: bankData.website,
          swiftCode: bankData.swiftCode,
          routingNumber: bankData.routingNumber,
          source: bankData.source,
          active: true
        }
      })
    }
    
    console.log(`✅ Successfully seeded ${bankSeeds.length} banks`)
  } catch (error) {
    console.error('❌ Error seeding banks:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedBanks()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedBanks }
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkWallets() {
  try {
    console.log('Checking wallets and sub-wallets...')

    const countries = await prisma.country.findMany({
      where: { active: true },
      include: {
        wallet: {
          include: {
            subWallets: {
              include: {
                countryPaymentMethod: {
                  include: {
                    paymentMethod: true
                  }
                }
              }
            }
          }
        }
      }
    })

    for (const country of countries) {
      console.log(`\n=== ${country.name} (${country.code}) ===`)
      
      if (!country.wallet) {
        console.log('❌ No wallet found')
        
        // Créer le portefeuille
        const wallet = await prisma.wallet.create({
          data: {
            countryId: country.id,
            balance: 10000,
            active: true
          }
        })
        console.log('✅ Created wallet with balance 10000')
        
        // Créer des sous-portefeuilles pour les méthodes de paiement
        const countryMethods = await prisma.countryPaymentMethod.findMany({
          where: { countryId: country.id, active: true },
          include: { paymentMethod: true }
        })
        
        for (const method of countryMethods) {
          await prisma.subWallet.create({
            data: {
              walletId: wallet.id,
              countryPaymentMethodId: method.id,
              balance: 5000,
              active: true
            }
          })
          console.log(`✅ Created sub-wallet for ${method.paymentMethod.name} with balance 5000`)
        }
      } else {
        console.log(`✅ Wallet exists with balance: ${country.wallet.balance}`)
        
        if (country.wallet.subWallets.length === 0) {
          console.log('❌ No sub-wallets found')
          
          // Créer des sous-portefeuilles
          const countryMethods = await prisma.countryPaymentMethod.findMany({
            where: { countryId: country.id, active: true },
            include: { paymentMethod: true }
          })
          
          for (const method of countryMethods) {
            await prisma.subWallet.create({
              data: {
                walletId: country.wallet.id,
                countryPaymentMethodId: method.id,
                balance: 5000,
                active: true
              }
            })
            console.log(`✅ Created sub-wallet for ${method.paymentMethod.name} with balance 5000`)
          }
        } else {
          console.log('Sub-wallets:')
          for (const subWallet of country.wallet.subWallets) {
            console.log(`  - ${subWallet.countryPaymentMethod.paymentMethod.name}: ${subWallet.balance} ${country.currencyCode}`)
            
            // Mettre à jour le solde s'il est trop faible
            if (subWallet.balance.toNumber() < 1000) {
              await prisma.subWallet.update({
                where: { id: subWallet.id },
                data: { balance: 5000 }
              })
              console.log(`  ✅ Updated balance to 5000`)
            }
          }
        }
      }
    }

    console.log('\n✅ Wallet check completed!')
  } catch (error) {
    console.error('Error checking wallets:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  checkWallets()
    .then(() => {
      console.log('Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

export { checkWallets }
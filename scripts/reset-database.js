// Script pour vider et réinitialiser la base de données avec la nouvelle structure
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🗑️ Réinitialisation de la base de données...\n')

  try {
    // Désactiver les contraintes de clés étrangères temporairement
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`

    // Supprimer toutes les données dans l'ordre inverse des dépendances
    console.log('🧹 Suppression des données existantes...')
    
    await prisma.ticket.deleteMany({})
    console.log('  ✅ Tickets supprimés')
    
    await prisma.transaction.deleteMany({})
    console.log('  ✅ Transactions supprimées')
    
    await prisma.subWallet.deleteMany({})
    console.log('  ✅ Sous-portefeuilles supprimés')
    
    await prisma.wallet.deleteMany({})
    console.log('  ✅ Portefeuilles supprimés')
    
    await prisma.bankConfiguration.deleteMany({})
    console.log('  ✅ Configurations bancaires supprimées')
    
    await prisma.countryPaymentMethod.deleteMany({})
    console.log('  ✅ Associations pays-méthodes supprimées')
    
    await prisma.paymentMethod.deleteMany({})
    console.log('  ✅ Méthodes de paiement supprimées')
    
    await prisma.bank.deleteMany({})
    console.log('  ✅ Banques supprimées')
    
    await prisma.country.deleteMany({})
    console.log('  ✅ Pays supprimés')
    
    await prisma.region.deleteMany({})
    console.log('  ✅ Régions supprimées')
    
    await prisma.configuration.deleteMany({})
    console.log('  ✅ Configurations supprimées')
    
    await prisma.user.deleteMany({})
    console.log('  ✅ Utilisateurs supprimés')

    // Réactiver les contraintes de clés étrangères
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`

    console.log('\n🎉 Base de données vidée avec succès!')
    console.log('\n📝 Vous pouvez maintenant exécuter:')
    console.log('   npm run db:push')
    console.log('   npm run db:seed')

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
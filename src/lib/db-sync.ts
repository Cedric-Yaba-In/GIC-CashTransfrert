import { seedDatabase } from '../../prisma/seed'

export async function syncDatabase() {
  console.log('🔄 Synchronisation de la base de données...')
  await seedDatabase()
}
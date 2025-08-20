import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
// Import direct des données de banques
const bankSeeds = [
  // France
  { name: 'BNP Paribas', code: 'BNPPARIBAS', countryCode: 'FR', logo: 'https://logos-world.net/wp-content/uploads/2021/02/BNP-Paribas-Logo.png', website: 'https://www.bnpparibas.fr', swiftCode: 'BNPAFRPP', source: 'MANUAL' },
  { name: 'Crédit Agricole', code: 'CREDITAGRICOLE', countryCode: 'FR', logo: 'https://logos-world.net/wp-content/uploads/2021/02/Credit-Agricole-Logo.png', website: 'https://www.credit-agricole.fr', swiftCode: 'AGRIFRPP', source: 'MANUAL' },
  { name: 'Société Générale', code: 'SOCIETEGENERALE', countryCode: 'FR', logo: 'https://logos-world.net/wp-content/uploads/2021/02/Societe-Generale-Logo.png', website: 'https://www.societegenerale.fr', swiftCode: 'SOGEFRPP', source: 'MANUAL' },
  
  // États-Unis
  { name: 'JPMorgan Chase', code: 'CHASE', countryCode: 'US', logo: 'https://logos-world.net/wp-content/uploads/2021/02/JPMorgan-Chase-Logo.png', website: 'https://www.chase.com', swiftCode: 'CHASUS33', routingNumber: '021000021', source: 'MANUAL' },
  { name: 'Bank of America', code: 'BOA', countryCode: 'US', logo: 'https://logos-world.net/wp-content/uploads/2021/02/Bank-of-America-Logo.png', website: 'https://www.bankofamerica.com', swiftCode: 'BOFAUS3N', routingNumber: '011000138', source: 'MANUAL' },
  
  // Royaume-Uni
  { name: 'Barclays', code: 'BARCLAYS', countryCode: 'GB', logo: 'https://logos-world.net/wp-content/uploads/2021/02/Barclays-Logo.png', website: 'https://www.barclays.co.uk', swiftCode: 'BARCGB22', source: 'MANUAL' },
  { name: 'HSBC UK', code: 'HSBC', countryCode: 'GB', logo: 'https://logos-world.net/wp-content/uploads/2021/02/HSBC-Logo.png', website: 'https://www.hsbc.co.uk', swiftCode: 'HBUKGB4B', source: 'MANUAL' },
  
  // Sénégal
  { name: 'Banque de l\'Habitat du Sénégal', code: 'BHS', countryCode: 'SN', swiftCode: 'BHSNSNDX', source: 'MANUAL' },
  { name: 'Société Générale Sénégal', code: 'SGSN', countryCode: 'SN', swiftCode: 'SOGESNDX', source: 'MANUAL' },
  { name: 'Ecobank Sénégal', code: 'ECOSN', countryCode: 'SN', swiftCode: 'ECOSNSNDX', source: 'MANUAL' },
  
  // Côte d'Ivoire
  { name: 'Société Générale Côte d\'Ivoire', code: 'SGCI', countryCode: 'CI', swiftCode: 'SOGECIDX', source: 'MANUAL' },
  { name: 'Ecobank Côte d\'Ivoire', code: 'ECOCI', countryCode: 'CI', swiftCode: 'ECOCIDX', source: 'MANUAL' },
  
  // Cameroun
  { name: 'Afriland First Bank', code: 'AFRILAND', countryCode: 'CM', swiftCode: 'CCBKCMCX', source: 'MANUAL' },
  { name: 'Commercial Bank of Cameroon', code: 'CBC', countryCode: 'CM', swiftCode: 'CBCMCMCX', source: 'MANUAL' }
]

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🚀 Initialisation de la base de données...')
    
    // 1. Créer l'utilisateur admin uniquement
    const hashedPassword = await hashPassword('admin123')
    await prisma.user.upsert({
      where: { email: 'admin@gicpromoteltd.com' },
      update: {},
      create: {
        email: 'admin@gicpromoteltd.com',
        password: hashedPassword,
        name: 'Administrateur GIC',
        role: 'ADMIN',
      },
    })
    console.log('✅ Utilisateur admin créé')

    console.log('🎉 Initialisation terminée!')
    console.log('ℹ️ Utilisez le bouton "Synchroniser" pour charger les données complètes')
    
    return NextResponse.json({ 
      message: 'Utilisateur admin créé. Utilisez le bouton "Synchroniser" pour charger toutes les données.',
      success: true,
      details: {
        adminCreated: true
      }
    })
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
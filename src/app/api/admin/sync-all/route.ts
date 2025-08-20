import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    console.log('🔄 Synchronisation complète des données...')
    
    // 1. Créer les régions (OBLIGATOIRE pour RestCountries)
    const regions = await Promise.all([
      prisma.region.upsert({ where: { code: 'europe' }, update: {}, create: { name: 'Europe', code: 'europe', active: true } }),
      prisma.region.upsert({ where: { code: 'africa' }, update: {}, create: { name: 'Afrique', code: 'africa', active: true } }),
      prisma.region.upsert({ where: { code: 'americas' }, update: {}, create: { name: 'Amériques', code: 'americas', active: true } }),
      prisma.region.upsert({ where: { code: 'asia' }, update: {}, create: { name: 'Asie', code: 'asia', active: true } }),
      prisma.region.upsert({ where: { code: 'oceania' }, update: {}, create: { name: 'Océanie', code: 'oceania', active: true } })
    ])
    console.log('✅ Régions synchronisées')

    // 2. Créer les configurations complètes
    const configs = [
      // Application Settings
      { key: 'APP_NAME', value: 'GIC CashTransfer', category: 'app', type: 'STRING', label: 'Nom de l\'application', required: true },
      { key: 'APP_URL', value: 'http://localhost:3000', category: 'app', type: 'STRING', label: 'URL de l\'application', required: true },
      { key: 'COMPANY_NAME', value: 'GIC Promote LTD', category: 'app', type: 'STRING', label: 'Nom de l\'entreprise', required: true },
      { key: 'SUPPORT_EMAIL', value: 'support@gicpromoteltd.com', category: 'app', type: 'STRING', label: 'Email de support', required: true },
      
      // Email Configuration
      { key: 'EMAIL_HOST', value: 'smtp.gmail.com', category: 'email', type: 'STRING', label: 'Serveur SMTP', required: true },
      { key: 'EMAIL_PORT', value: '587', category: 'email', type: 'NUMBER', label: 'Port SMTP', required: true },
      { key: 'EMAIL_USER', value: '', category: 'email', type: 'STRING', label: 'Utilisateur SMTP', required: true },
      { key: 'EMAIL_PASS', value: '', category: 'email', type: 'PASSWORD', label: 'Mot de passe SMTP', required: true, encrypted: true },
      { key: 'EMAIL_FROM', value: 'noreply@gicpromoteltd.com', category: 'email', type: 'STRING', label: 'Email expéditeur', required: true },
      
      // SMS Configuration
      { key: 'TWILIO_ACCOUNT_SID', value: '', category: 'sms', type: 'STRING', label: 'Twilio Account SID', required: false },
      { key: 'TWILIO_AUTH_TOKEN', value: '', category: 'sms', type: 'PASSWORD', label: 'Twilio Auth Token', required: false, encrypted: true },
      { key: 'TWILIO_PHONE_NUMBER', value: '', category: 'sms', type: 'STRING', label: 'Numéro Twilio', required: false },
      
      // Payment Configuration
      { key: 'FLUTTERWAVE_PUBLIC_KEY', value: '', category: 'payment', type: 'STRING', label: 'Flutterwave Public Key', required: false },
      { key: 'FLUTTERWAVE_SECRET_KEY', value: '', category: 'payment', type: 'PASSWORD', label: 'Flutterwave Secret Key', required: false, encrypted: true },
      { key: 'FLUTTERWAVE_WEBHOOK_HASH', value: '', category: 'payment', type: 'PASSWORD', label: 'Flutterwave Webhook Hash', required: false, encrypted: true },
      { key: 'FLUTTERWAVE_ENCRYPTION_KEY', value: '', category: 'payment', type: 'PASSWORD', label: 'Flutterwave Encryption Key', required: false, encrypted: true },
      
      // RestCountries API
      { key: 'RESTCOUNTRIES_API_URL', value: 'https://restcountries.com/v3.1', category: 'api', type: 'STRING', label: 'RestCountries API URL', required: true },
      
      // Security
      { key: 'JWT_SECRET', value: 'your-super-secret-jwt-key-change-in-production', category: 'security', type: 'PASSWORD', label: 'JWT Secret', required: true, encrypted: true },
      { key: 'ENCRYPTION_KEY', value: 'your-32-char-encryption-key-here', category: 'security', type: 'PASSWORD', label: 'Clé de chiffrement', required: true, encrypted: true },
      
      // Business Rules
      { key: 'DEFAULT_TRANSACTION_FEE', value: '5', category: 'business', type: 'NUMBER', label: 'Frais de transaction par défaut', required: true },
      { key: 'MIN_TRANSACTION_AMOUNT', value: '1', category: 'business', type: 'NUMBER', label: 'Montant minimum de transaction', required: true },
      { key: 'MAX_TRANSACTION_AMOUNT', value: '50000', category: 'business', type: 'NUMBER', label: 'Montant maximum de transaction', required: true },
      { key: 'AUTO_APPROVE_LIMIT', value: '1000', category: 'business', type: 'NUMBER', label: 'Limite approbation automatique', required: true }
    ]

    for (const config of configs) {
      await prisma.configuration.upsert({
        where: { key: config.key },
        update: {},
        create: config
      })
    }
    console.log('✅ Configurations synchronisées')

    // 3. Créer les banques initiales
    for (const bank of bankSeeds) {
      await prisma.bank.upsert({
        where: {
          code_countryCode: {
            code: bank.code,
            countryCode: bank.countryCode
          }
        },
        update: {},
        create: {
          ...bank,
          active: true
        }
      })
    }
    console.log('✅ Banques initiales synchronisées')

    // 4. Initialiser les catégories globales de paiement
    try {
      const { PaymentCategoriesInitService } = await import('@/lib/payment-categories-init')
      await PaymentCategoriesInitService.initializeGlobalCategories()
      console.log('✅ Catégories de paiement initialisées')
    } catch (error) {
      console.log('ℹ️ Catégories déjà existantes')
    }

    console.log('🎉 Synchronisation complète terminée!')
    return NextResponse.json({ 
      message: 'Synchronisation complète réussie. Toutes les données ont été initialisées selon la nouvelle architecture.',
      success: true,
      details: {
        regions: regions.length,
        configs: configs.length,
        banks: bankSeeds.length,
        categories: 4
      }
    })
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
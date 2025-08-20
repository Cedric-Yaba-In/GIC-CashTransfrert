import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'
import { bankSeeds } from './bank-seeds'

const prisma = new PrismaClient()

export async function seedDatabase() {
  console.log('🔄 Initialisation de la base de données...')
  
  try {
    // Vérifier si les tables existent
    try {
      await prisma.$queryRaw`SELECT 1 FROM users LIMIT 1`
    } catch (error) {
      console.log('⚠️ Tables non créées, initialisation ignorée')
      return
    }

    // Vérifier si déjà initialisé
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@gicpromoteltd.com' }
    })

    if (adminExists) {
      console.log('✅ Base de données déjà initialisée')
      return
    }
    // Créer l'utilisateur admin
    const hashedPassword = await hashPassword('admin123')
    
    await prisma.user.create({
      data: {
        email: 'admin@gicpromoteltd.com',
        password: hashedPassword,
        name: 'Administrateur GIC',
        role: 'ADMIN',
      },
    })

    // Créer les régions
    const regionsData = [
      { name: 'Europe', code: 'europe', active: true },
      { name: 'Afrique', code: 'africa', active: true },
      { name: 'Amériques', code: 'americas', active: true },
      { name: 'Asie', code: 'asia', active: true },
      { name: 'Océanie', code: 'oceania', active: true }
    ]
    
    for (const regionData of regionsData) {
      const existing = await prisma.region.findUnique({ where: { code: regionData.code } })
      if (!existing) {
        await prisma.region.create({ data: regionData })
      }
    }

    // Créer les méthodes de paiement de base
    const paymentMethodsData = [
      {
        name: 'Flutterwave',
        type: 'FLUTTERWAVE',
        category: 'HYBRID',
        minAmount: 10,
        maxAmount: 10000000,
        active: true,
      },
      {
        name: 'CinetPay',
        type: 'CINETPAY',
        category: 'HYBRID',
        minAmount: 1000,
        maxAmount: 10000000,
        active: true,
      },
      {
        name: 'Mobile Money',
        type: 'MOBILE_MONEY',
        category: 'MOBILE_MONEY',
        minAmount: 5,
        maxAmount: 1000000,
        active: true,
      },
      {
        name: 'Virement bancaire',
        type: 'BANK_TRANSFER',
        category: 'BANK_TRANSFER',
        minAmount: 50,
        maxAmount: 10000000,
        active: true,
      }
    ]
    
    for (const methodData of paymentMethodsData) {
      const existing = await prisma.paymentMethod.findFirst({ where: { name: methodData.name } })
      if (!existing) {
        await prisma.paymentMethod.create({ data: methodData })
      }
    }



    // Créer les configurations par défaut
    const configurationsData = [
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
      
      // CinetPay Configuration
      { key: 'CINETPAY_API_KEY', value: '', category: 'cinetpay', type: 'PASSWORD', label: 'Clé API CinetPay', required: false, encrypted: true },
      { key: 'CINETPAY_SITE_ID', value: '', category: 'cinetpay', type: 'PASSWORD', label: 'Site ID CinetPay', required: false, encrypted: true },
      { key: 'CINETPAY_SECRET_KEY', value: '', category: 'cinetpay', type: 'PASSWORD', label: 'Clé secrète CinetPay', required: false, encrypted: true },
      { key: 'CINETPAY_API_PASSWORD', value: '', category: 'cinetpay', type: 'PASSWORD', label: 'Mot de passe API CinetPay', required: false, encrypted: true },
      { key: 'CINETPAY_NOTIFY_URL', value: 'http://localhost:3000/api/cinetpay/callback', category: 'cinetpay', type: 'STRING', label: 'URL de notification CinetPay', required: false },
      
      // RestCountries API
      { key: 'RESTCOUNTRIES_API_URL', value: 'https://restcountries.com/v3.1', category: 'api', type: 'STRING', label: 'RestCountries API URL', required: true },
      
      // Security
      { key: 'JWT_SECRET', value: 'your-super-secret-jwt-key-change-in-production', category: 'security', type: 'PASSWORD', label: 'JWT Secret', required: true, encrypted: true },
      { key: 'ENCRYPTION_KEY', value: 'your-32-char-encryption-key-here', category: 'security', type: 'PASSWORD', label: 'Clé de chiffrement', required: true, encrypted: true },
      
      // Business Rules
      { key: 'DEFAULT_TRANSACTION_FEE', value: '2.5', category: 'business', type: 'NUMBER', label: 'Frais de transaction par défaut', required: true },
      { key: 'MIN_TRANSACTION_AMOUNT', value: '1', category: 'business', type: 'NUMBER', label: 'Montant minimum de transaction', required: true },
      { key: 'MAX_TRANSACTION_AMOUNT', value: '50000', category: 'business', type: 'NUMBER', label: 'Montant maximum de transaction', required: true },
      { key: 'AUTO_APPROVE_LIMIT', value: '1000', category: 'business', type: 'NUMBER', label: 'Limite approbation automatique', required: true }
    ]
    
    for (const configData of configurationsData) {
      const existing = await prisma.configuration.findUnique({ where: { key: configData.key } })
      if (!existing) {
        await prisma.configuration.create({ data: configData })
      }
    }

    // Créer les banques
    for (const bankData of bankSeeds) {
      const existing = await prisma.bank.findFirst({
        where: {
          code: bankData.code,
          countryCode: bankData.countryCode
        }
      })
      if (!existing) {
        await prisma.bank.create({ data: bankData })
      }
    }

    // Créer un taux global par défaut
    const existingRate = await prisma.transferRate.findFirst({
      where: { name: 'Standard International' }
    })
    
    if (!existingRate) {
      await prisma.transferRate.create({
        data: {
          name: 'Standard International',
          description: 'Taux de transfert standard pour tous les pays (devise de base: USD)',
          baseFee: 5.0,
          percentageFee: 2.0,
          minAmount: 1.0,
          maxAmount: 10000.0,
          exchangeRateMargin: 1.0,
          active: true,
          isDefault: true
        }
      })
    }

    console.log('✅ Base de données initialisée avec succès!')
    console.log('📝 Utilisateur admin: admin@gicpromoteltd.com / admin123')
    console.log('🌍 Régions créées: 5')
    console.log('💳 Méthodes de paiement: 4 (Flutterwave, CinetPay, Mobile Money, Virement)')
    console.log('🏦 Banques importées')
    console.log('⚙️ Configurations par défaut créées (incluant CinetPay)')
    console.log('💰 Taux de transfert par défaut créé')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Pour compatibilité avec l'exécution directe
async function main() {
  await seedDatabase()
}

// Exécution directe du script
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
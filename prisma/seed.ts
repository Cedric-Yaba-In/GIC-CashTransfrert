import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'
import { bankSeeds } from './bank-seeds'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await hashPassword('admin123')
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gicpromoteltd.com' },
    update: {},
    create: {
      email: 'admin@gicpromoteltd.com',
      password: hashedPassword,
      name: 'Administrateur GIC',
      role: 'ADMIN',
    },
  })

  // Create regions first
  const regions = await Promise.all([
    prisma.region.upsert({ where: { code: 'europe' }, update: {}, create: { name: 'Europe', code: 'europe', active: true } }),
    prisma.region.upsert({ where: { code: 'africa' }, update: {}, create: { name: 'Afrique', code: 'africa', active: true } }),
    prisma.region.upsert({ where: { code: 'americas' }, update: {}, create: { name: 'Amériques', code: 'americas', active: true } }),
    prisma.region.upsert({ where: { code: 'asia' }, update: {}, create: { name: 'Asie', code: 'asia', active: true } })
  ])

  // Create countries with new structure
  const countries = [
    { name: 'France', code: 'FR', currency: 'Euro', currencyCode: 'EUR', flag: '🇫🇷', callingCode: '+33', regionCode: 'europe' },
    { name: 'Sénégal', code: 'SN', currency: 'Franc CFA', currencyCode: 'XOF', flag: '🇸🇳', callingCode: '+221', regionCode: 'africa' },
    { name: 'Côte d\'Ivoire', code: 'CI', currency: 'Franc CFA', currencyCode: 'XOF', flag: '🇨🇮', callingCode: '+225', regionCode: 'africa' },
    { name: 'Cameroun', code: 'CM', currency: 'Franc CFA', currencyCode: 'XAF', flag: '🇨🇲', callingCode: '+237', regionCode: 'africa' },
    { name: 'États-Unis', code: 'US', currency: 'Dollar américain', currencyCode: 'USD', flag: '🇺🇸', callingCode: '+1', regionCode: 'americas' }
  ]

  for (const countryData of countries) {
    const region = regions.find(r => r.code === countryData.regionCode)
    const country = await prisma.country.upsert({
      where: { code: countryData.code },
      update: {},
      create: {
        name: countryData.name,
        code: countryData.code,
        currency: countryData.currency,
        currencyCode: countryData.currencyCode,
        flag: countryData.flag,
        callingCode: countryData.callingCode,
        regionId: region?.id,
        active: true
      }
    })

    // Create payment methods with new categorization
    // 1. Hybrid - Flutterwave
    const flutterwaveMethod = await prisma.paymentMethod.upsert({
      where: { name: `Flutterwave ${countryData.code}` },
      update: {},
      create: {
        name: `Flutterwave ${countryData.code}`,
        type: 'FLUTTERWAVE',
        category: 'HYBRID',
        subType: 'FLUTTERWAVE',
        minAmount: 1,
        maxAmount: 10000,
        active: true
      }
    })

    await prisma.countryPaymentMethod.upsert({
      where: {
        countryId_paymentMethodId: {
          countryId: country.id,
          paymentMethodId: flutterwaveMethod.id
        }
      },
      update: {},
      create: {
        countryId: country.id,
        paymentMethodId: flutterwaveMethod.id,
        active: true,
        fees: 5
      }
    })

    // 2. Bank Transfer Global (to enable tab)
    const bankTransferMethod = await prisma.paymentMethod.upsert({
      where: { name: `Bank Transfer ${countryData.code}` },
      update: {},
      create: {
        name: `Bank Transfer ${countryData.code}`,
        type: 'BANK_TRANSFER',
        category: 'BANK_TRANSFER',
        subType: 'GLOBAL',
        minAmount: 10,
        maxAmount: null,
        active: true
      }
    })

    await prisma.countryPaymentMethod.upsert({
      where: {
        countryId_paymentMethodId: {
          countryId: country.id,
          paymentMethodId: bankTransferMethod.id
        }
      },
      update: {},
      create: {
        countryId: country.id,
        paymentMethodId: bankTransferMethod.id,
        active: true,
        fees: 0
      }
    })

    // 3. Mobile Money for African countries
    if (['SN', 'CI', 'CM'].includes(countryData.code)) {
      // Orange Money
      const orangeMethod = await prisma.paymentMethod.upsert({
        where: { name: `Orange Money ${countryData.code}` },
        update: {},
        create: {
          name: `Orange Money ${countryData.code}`,
          type: 'MOBILE_MONEY',
          category: 'MOBILE_MONEY',
          subType: 'ORANGE',
          minAmount: 1,
          maxAmount: 5000,
          active: false
        }
      })

      await prisma.countryPaymentMethod.upsert({
        where: {
          countryId_paymentMethodId: {
            countryId: country.id,
            paymentMethodId: orangeMethod.id
          }
        },
        update: {},
        create: {
          countryId: country.id,
          paymentMethodId: orangeMethod.id,
          active: false,
          fees: 2
        }
      })

      // MTN Mobile Money
      const mtnMethod = await prisma.paymentMethod.upsert({
        where: { name: `MTN Mobile Money ${countryData.code}` },
        update: {},
        create: {
          name: `MTN Mobile Money ${countryData.code}`,
          type: 'MOBILE_MONEY',
          category: 'MOBILE_MONEY',
          subType: 'MTN',
          minAmount: 1,
          maxAmount: 5000,
          active: false
        }
      })

      await prisma.countryPaymentMethod.upsert({
        where: {
          countryId_paymentMethodId: {
            countryId: country.id,
            paymentMethodId: mtnMethod.id
          }
        },
        update: {},
        create: {
          countryId: country.id,
          paymentMethodId: mtnMethod.id,
          active: false,
          fees: 2
        }
      })
    }

    // Create wallet for country
    await prisma.wallet.upsert({
      where: { countryId: country.id },
      update: {},
      create: {
        countryId: country.id,
        balance: 0,
        active: true
      }
    })
  }

  console.log('✅ Pays et méthodes de paiement créés avec nouvelle structure')



  // Create default configurations only if none exist
  const existingConfigs = await prisma.configuration.count()
  if (existingConfigs === 0) {
    await prisma.configuration.createMany({
      data: [
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
        { key: 'DEFAULT_TRANSACTION_FEE', value: '2.5', category: 'business', type: 'NUMBER', label: 'Frais de transaction par défaut', required: true },
        { key: 'MIN_TRANSACTION_AMOUNT', value: '1', category: 'business', type: 'NUMBER', label: 'Montant minimum de transaction', required: true },
        { key: 'MAX_TRANSACTION_AMOUNT', value: '50000', category: 'business', type: 'NUMBER', label: 'Montant maximum de transaction', required: true },
        { key: 'AUTO_APPROVE_LIMIT', value: '1000', category: 'business', type: 'NUMBER', label: 'Limite approbation automatique', required: true }
      ]
    })
    console.log('✅ Configurations créées')
  } else {
    console.log('ℹ️ Configurations déjà existantes')
  }

  // Create banks only if none exist
  const existingBanks = await prisma.bank.count()
  if (existingBanks === 0) {
    await prisma.bank.createMany({
      data: bankSeeds
    })
    console.log('✅ Banques créées')
  } else {
    console.log('ℹ️ Banques déjà existantes')
  }

  console.log('Database seeded successfully!')
  console.log('✅ Configurations par défaut créées')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

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

  // Create payment methods only if none exist
  const existingPaymentMethods = await prisma.paymentMethod.count()
  if (existingPaymentMethods === 0) {
    await prisma.paymentMethod.createMany({
      data: [
        {
          name: 'Flutterwave',
          type: 'FLUTTERWAVE',
          minAmount: 10,
          maxAmount: 10000,
          active: true,
        },
        {
          name: 'Mobile Money',
          type: 'MOBILE_MONEY',
          minAmount: 5,
          maxAmount: 5000,
          active: true,
        },
        {
          name: 'Virement bancaire',
          type: 'BANK_TRANSFER',
          minAmount: 50,
          maxAmount: 50000,
          active: true,
        }
      ]
    })
    console.log('✅ Méthodes de paiement créées')
  } else {
    console.log('ℹ️ Méthodes de paiement déjà existantes')
  }

  // Create regions only if none exist
  const existingRegions = await prisma.region.count()
  if (existingRegions === 0) {
    await prisma.region.createMany({
      data: [
        { name: 'Europe', code: 'europe', active: true },
        { name: 'Africa', code: 'africa', active: true },
        { name: 'Asia', code: 'asia', active: true },
        { name: 'Americas', code: 'americas', active: true },
        { name: 'Oceania', code: 'oceania', active: true }
      ]
    })
    console.log('✅ Régions créées')
  } else {
    console.log('ℹ️ Régions déjà existantes')
  }

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
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const existingConfigs = await prisma.configuration.count()
    
    if (existingConfigs > 0) {
      return NextResponse.json({ 
        message: 'Configurations déjà existantes',
        count: existingConfigs 
      })
    }

    await prisma.configuration.createMany({
      data: [
        { key: 'APP_NAME', value: 'GIC CashTransfer', category: 'app', type: 'STRING', label: 'Nom de l\'application', required: true },
        { key: 'APP_URL', value: 'http://localhost:3000', category: 'app', type: 'STRING', label: 'URL de l\'application', required: true },
        { key: 'COMPANY_NAME', value: 'GIC Promote LTD', category: 'app', type: 'STRING', label: 'Nom de l\'entreprise', required: true },
        { key: 'SUPPORT_EMAIL', value: 'support@gicpromoteltd.com', category: 'app', type: 'STRING', label: 'Email de support', required: true },
        { key: 'EMAIL_HOST', value: 'smtp.gmail.com', category: 'email', type: 'STRING', label: 'Serveur SMTP', required: true },
        { key: 'EMAIL_PORT', value: '587', category: 'email', type: 'NUMBER', label: 'Port SMTP', required: true },
        { key: 'EMAIL_USER', value: '', category: 'email', type: 'STRING', label: 'Utilisateur SMTP', required: true },
        { key: 'EMAIL_PASS', value: '', category: 'email', type: 'PASSWORD', label: 'Mot de passe SMTP', required: true, encrypted: true },
        { key: 'EMAIL_FROM', value: 'noreply@gicpromoteltd.com', category: 'email', type: 'STRING', label: 'Email expéditeur', required: true },
        { key: 'TWILIO_ACCOUNT_SID', value: '', category: 'sms', type: 'STRING', label: 'Twilio Account SID', required: false },
        { key: 'TWILIO_AUTH_TOKEN', value: '', category: 'sms', type: 'PASSWORD', label: 'Twilio Auth Token', required: false, encrypted: true },
        { key: 'TWILIO_PHONE_NUMBER', value: '', category: 'sms', type: 'STRING', label: 'Numéro Twilio', required: false },
        { key: 'FLUTTERWAVE_PUBLIC_KEY', value: '', category: 'payment', type: 'STRING', label: 'Flutterwave Public Key', required: false },
        { key: 'FLUTTERWAVE_SECRET_KEY', value: '', category: 'payment', type: 'PASSWORD', label: 'Flutterwave Secret Key', required: false, encrypted: true },
        { key: 'FLUTTERWAVE_WEBHOOK_HASH', value: '', category: 'payment', type: 'PASSWORD', label: 'Flutterwave Webhook Hash', required: false, encrypted: true },
        { key: 'FLUTTERWAVE_ENCRYPTION_KEY', value: '', category: 'payment', type: 'PASSWORD', label: 'Flutterwave Encryption Key', required: false, encrypted: true },
        { key: 'CINETPAY_API_KEY', value: '', category: 'cinetpay', type: 'PASSWORD', label: 'Clé API CinetPay', required: false, encrypted: true },
        { key: 'CINETPAY_SITE_ID', value: '', category: 'cinetpay', type: 'PASSWORD', label: 'Site ID CinetPay', required: false, encrypted: true },
        { key: 'CINETPAY_SECRET_KEY', value: '', category: 'cinetpay', type: 'PASSWORD', label: 'Clé secrète CinetPay', required: false, encrypted: true },
        { key: 'CINETPAY_API_PASSWORD', value: '', category: 'cinetpay', type: 'PASSWORD', label: 'Mot de passe API CinetPay', required: false, encrypted: true },
        { key: 'CINETPAY_NOTIFY_URL', value: 'http://localhost:3000/api/cinetpay/callback', category: 'cinetpay', type: 'STRING', label: 'URL de notification CinetPay', required: false },
        { key: 'RESTCOUNTRIES_API_URL', value: 'https://restcountries.com/v3.1', category: 'api', type: 'STRING', label: 'RestCountries API URL', required: true },
        { key: 'JWT_SECRET', value: 'your-super-secret-jwt-key-change-in-production', category: 'security', type: 'PASSWORD', label: 'JWT Secret', required: true, encrypted: true },
        { key: 'ENCRYPTION_KEY', value: 'your-32-char-encryption-key-here', category: 'security', type: 'PASSWORD', label: 'Clé de chiffrement', required: true, encrypted: true },
        { key: 'DEFAULT_TRANSACTION_FEE', value: '2.5', category: 'business', type: 'NUMBER', label: 'Frais de transaction par défaut (%)', required: true },
        { key: 'MIN_TRANSACTION_AMOUNT', value: '1', category: 'business', type: 'NUMBER', label: 'Montant minimum de transaction', required: true },
        { key: 'MAX_TRANSACTION_AMOUNT', value: '50000', category: 'business', type: 'NUMBER', label: 'Montant maximum de transaction', required: true },
        { key: 'AUTO_APPROVE_LIMIT', value: '1000', category: 'business', type: 'NUMBER', label: 'Limite d\'approbation automatique', required: true }
      ]
    })

    const count = await prisma.configuration.count()
    
    return NextResponse.json({ 
      message: 'Configurations créées avec succès',
      count 
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création des configurations' },
      { status: 500 }
    )
  }
}
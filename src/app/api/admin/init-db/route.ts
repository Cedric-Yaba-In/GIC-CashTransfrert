import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
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

    const existingPaymentMethods = await prisma.paymentMethod.count()
    if (existingPaymentMethods === 0) {
      await prisma.paymentMethod.createMany({
        data: [
          { name: 'Flutterwave', type: 'FLUTTERWAVE', minAmount: 10, maxAmount: 10000, active: true },
          { name: 'Mobile Money', type: 'MOBILE_MONEY', minAmount: 5, maxAmount: 5000, active: true },
          { name: 'Virement bancaire', type: 'BANK_TRANSFER', minAmount: 50, maxAmount: 50000, active: true }
        ]
      })
    }

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
    }

    const existingConfigs = await prisma.configuration.count()
    if (existingConfigs === 0) {
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
          { key: 'DEFAULT_TRANSACTION_FEE', value: '2.5', category: 'business', type: 'NUMBER', label: 'Frais de transaction par défaut', required: true },
          { key: 'MIN_TRANSACTION_AMOUNT', value: '1', category: 'business', type: 'NUMBER', label: 'Montant minimum de transaction', required: true },
          { key: 'MAX_TRANSACTION_AMOUNT', value: '50000', category: 'business', type: 'NUMBER', label: 'Montant maximum de transaction', required: true }
        ]
      })
    }

    return NextResponse.json({ 
      message: 'Base de données initialisée avec succès',
      success: true 
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation' },
      { status: 500 }
    )
  }
}
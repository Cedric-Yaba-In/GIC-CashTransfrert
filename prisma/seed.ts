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

  // Create payment methods
  const flutterwave = await prisma.paymentMethod.upsert({
    where: { id: 'flutterwave' },
    update: {},
    create: {
      id: 'flutterwave',
      name: 'Flutterwave',
      type: 'FLUTTERWAVE',
      minAmount: 10,
      maxAmount: 10000,
      active: true,
    },
  })

  const mobileMoney = await prisma.paymentMethod.upsert({
    where: { id: 'mobile-money' },
    update: {},
    create: {
      id: 'mobile-money',
      name: 'Mobile Money',
      type: 'MOBILE_MONEY',
      minAmount: 5,
      maxAmount: 5000,
      active: true,
    },
  })

  const bankTransfer = await prisma.paymentMethod.upsert({
    where: { id: 'bank-transfer' },
    update: {},
    create: {
      id: 'bank-transfer',
      name: 'Virement bancaire',
      type: 'BANK_TRANSFER',
      minAmount: 50,
      maxAmount: 50000,
      active: true,
    },
  })

  // Create sample countries
  const france = await prisma.country.upsert({
    where: { code: 'FR' },
    update: {},
    create: {
      name: 'France',
      code: 'FR',
      currency: 'Euro',
      currencyCode: 'EUR',
      flag: 'https://flagcdn.com/fr.svg',
      active: true,
    },
  })

  const senegal = await prisma.country.upsert({
    where: { code: 'SN' },
    update: {},
    create: {
      name: 'Sénégal',
      code: 'SN',
      currency: 'Franc CFA',
      currencyCode: 'XOF',
      flag: 'https://flagcdn.com/sn.svg',
      active: true,
    },
  })

  // Create wallets
  const franceWallet = await prisma.wallet.upsert({
    where: { countryId: france.id },
    update: {},
    create: {
      countryId: france.id,
      balance: 10000,
    },
  })

  const senegalWallet = await prisma.wallet.upsert({
    where: { countryId: senegal.id },
    update: {},
    create: {
      countryId: senegal.id,
      balance: 5000000, // 5M XOF
    },
  })

  // Link payment methods to countries
  await prisma.countryPaymentMethod.upsert({
    where: { 
      countryId_paymentMethodId: {
        countryId: france.id,
        paymentMethodId: flutterwave.id
      }
    },
    update: {},
    create: {
      countryId: france.id,
      paymentMethodId: flutterwave.id,
      active: true,
      minAmount: 10,
      maxAmount: 10000,
    },
  })

  await prisma.countryPaymentMethod.upsert({
    where: { 
      countryId_paymentMethodId: {
        countryId: france.id,
        paymentMethodId: bankTransfer.id
      }
    },
    update: {},
    create: {
      countryId: france.id,
      paymentMethodId: bankTransfer.id,
      active: true,
      minAmount: 50,
      maxAmount: 50000,
    },
  })

  await prisma.countryPaymentMethod.upsert({
    where: { 
      countryId_paymentMethodId: {
        countryId: senegal.id,
        paymentMethodId: mobileMoney.id
      }
    },
    update: {},
    create: {
      countryId: senegal.id,
      paymentMethodId: mobileMoney.id,
      active: true,
      minAmount: 5,
      maxAmount: 5000,
    },
  })

  // Create sub-wallets
  await prisma.subWallet.upsert({
    where: {
      walletId_paymentMethodId: {
        walletId: franceWallet.id,
        paymentMethodId: flutterwave.id
      }
    },
    update: {},
    create: {
      walletId: franceWallet.id,
      paymentMethodId: flutterwave.id,
      balance: 5000,
    },
  })

  await prisma.subWallet.upsert({
    where: {
      walletId_paymentMethodId: {
        walletId: franceWallet.id,
        paymentMethodId: bankTransfer.id
      }
    },
    update: {},
    create: {
      walletId: franceWallet.id,
      paymentMethodId: bankTransfer.id,
      balance: 5000,
    },
  })

  await prisma.subWallet.upsert({
    where: {
      walletId_paymentMethodId: {
        walletId: senegalWallet.id,
        paymentMethodId: mobileMoney.id
      }
    },
    update: {},
    create: {
      walletId: senegalWallet.id,
      paymentMethodId: mobileMoney.id,
      balance: 2500000,
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
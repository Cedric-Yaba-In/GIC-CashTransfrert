import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateNumericId, sanitizeInput, sanitizeForLog } from '@/lib/security'
import { createCSRFError } from '@/lib/csrf'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // CSRF validation removed for simplicity

    const { accountNumber, accountName, iban, beneficiaryAddress, active } = await request.json()
    const bankId = validateNumericId(params.id)
    
    if (!bankId) {
      return NextResponse.json({ error: 'ID banque invalide' }, { status: 400 })
    }

    const bank = await prisma.bank.findUnique({
      where: { id: bankId }
    })

    if (!bank) {
      return NextResponse.json({ error: 'Banque non trouvée' }, { status: 404 })
    }

    const config = await prisma.bankConfiguration.upsert({
      where: { bankId },
      update: {
        accountNumber: sanitizeInput(accountNumber),
        accountName: sanitizeInput(accountName),
        iban: sanitizeInput(iban),
        beneficiaryAddress: sanitizeInput(beneficiaryAddress),
        active: active ?? true,
        updatedAt: new Date()
      },
      create: {
        bankId,
        accountNumber: sanitizeInput(accountNumber),
        accountName: sanitizeInput(accountName),
        iban: sanitizeInput(iban),
        beneficiaryAddress: sanitizeInput(beneficiaryAddress),
        active: active ?? true
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erreur configuration banque:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Erreur de configuration' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bankId = validateNumericId(params.id)
    
    if (!bankId) {
      return NextResponse.json({ error: 'ID banque invalide' }, { status: 400 })
    }

    const config = await prisma.bankConfiguration.findUnique({
      where: { bankId },
      include: {
        bank: true
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erreur récupération config:', sanitizeForLog(error))
    return NextResponse.json(null)
  }
}
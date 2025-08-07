import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { accountNumber, accountName, iban, beneficiaryAddress, active } = await request.json()
    const bankId = parseInt(params.id)

    const bank = await prisma.bank.findUnique({
      where: { id: bankId }
    })

    if (!bank) {
      return NextResponse.json({ error: 'Banque non trouvée' }, { status: 404 })
    }

    const config = await prisma.bankConfiguration.upsert({
      where: { bankId },
      update: {
        accountNumber,
        accountName,
        iban,
        beneficiaryAddress,
        active: active ?? true,
        updatedAt: new Date()
      },
      create: {
        bankId,
        accountNumber,
        accountName,
        iban,
        beneficiaryAddress,
        active: active ?? true
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erreur configuration banque:', error)
    return NextResponse.json({ error: 'Erreur de configuration' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bankId = parseInt(params.id)

    const config = await prisma.bankConfiguration.findUnique({
      where: { bankId },
      include: {
        bank: true
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erreur récupération config:', error)
    return NextResponse.json(null)
  }
}
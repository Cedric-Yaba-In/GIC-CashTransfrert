import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeInput, validateEmail, validateAmount, sanitizeForLog, validateCSRFRequest } from '@/lib/security'
import { createCSRFError } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

function generateTransactionReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `GIC${timestamp}${random}`.toUpperCase()
}

export async function POST(request: Request) {
  try {
    if (!validateCSRFRequest(request as any)) {
      return createCSRFError()
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.senderName || !data.senderEmail || !data.senderPhone ||
        !data.receiverName || !data.receiverPhone || !data.amount) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Validate email
    if (!validateEmail(data.senderEmail)) {
      return NextResponse.json({ error: 'Email expéditeur invalide' }, { status: 400 })
    }

    if (data.receiverEmail && !validateEmail(data.receiverEmail)) {
      return NextResponse.json({ error: 'Email destinataire invalide' }, { status: 400 })
    }

    // Validate amount
    const validAmount = validateAmount(data.amount)
    if (!validAmount) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    const reference = generateTransactionReference()
    
    const transaction = await prisma.transaction.create({
      data: {
        reference,
        senderName: sanitizeInput(data.senderName),
        senderEmail: sanitizeInput(data.senderEmail),
        senderPhone: sanitizeInput(data.senderPhone),
        senderCountryId: parseInt(data.senderCountryId),
        receiverName: sanitizeInput(data.receiverName),
        receiverEmail: data.receiverEmail ? sanitizeInput(data.receiverEmail) : null,
        receiverPhone: sanitizeInput(data.receiverPhone),
        receiverCountryId: parseInt(data.receiverCountryId),
        amount: validAmount,
        fees: validateAmount(data.fees) || 0,
        totalAmount: validateAmount(data.totalAmount) || validAmount,
        senderPaymentMethodId: parseInt(data.senderPaymentMethodId || data.paymentMethodId),
        receiverPaymentMethodId: data.receiverPaymentMethodId ? parseInt(data.receiverPaymentMethodId) : null,
        status: 'PENDING',
      },
      include: {
        senderCountry: true,
        receiverCountry: true,
        senderPaymentMethod: true,
        receiverPaymentMethod: true,
      }
    })

    // Create support ticket
    await prisma.ticket.create({
      data: {
        transactionId: transaction.id,
        subject: `Support pour transaction ${reference}`,
        status: 'OPEN',
      }
    })

    return NextResponse.json({ transaction, reference })
  } catch (error) {
    console.error('Transaction creation error:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Erreur de création de transaction' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = sanitizeInput(searchParams.get('reference') || '')
    
    if (reference) {
      const transaction = await prisma.transaction.findUnique({
        where: { reference },
        include: {
          senderCountry: true,
          receiverCountry: true,
          senderPaymentMethod: true,
          receiverPaymentMethod: true,
        }
      })
      
      if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }
      
      return NextResponse.json(transaction)
    }

    const transactions = await prisma.transaction.findMany({
      include: {
        senderCountry: true,
        receiverCountry: true,
        senderPaymentMethod: true,
        receiverPaymentMethod: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Transaction fetch error:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Erreur de récupération des transactions' }, { status: 500 })
  }
}
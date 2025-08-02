import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, transactionReference, message } = await request.json()

    const transaction = await prisma.transaction.findUnique({
      where: { reference: transactionReference },
      include: { tickets: true }
    })

    if (!transaction || transaction.senderEmail !== email) {
      return NextResponse.json({ error: 'Transaction not found or email mismatch' }, { status: 404 })
    }

    const ticket = transaction.tickets[0]
    if (ticket) {
      // Update existing ticket with new message
      const updatedTicket = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { message: message }
      })

      return NextResponse.json({ ticket: updatedTicket })
    } else {
      return NextResponse.json({ error: 'No ticket found' }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process ticket' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const reference = searchParams.get('reference')

    if (!email || !reference) {
      return NextResponse.json({ error: 'Email and reference required' }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { tickets: true }
    })

    if (!transaction || transaction.senderEmail !== email) {
      return NextResponse.json({ error: 'Transaction not found or email mismatch' }, { status: 404 })
    }

    return NextResponse.json(transaction.tickets[0] || null)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
  }
}
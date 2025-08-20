import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeForLog, validateEmail } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, transactionReference, message } = await request.json()

    if (!validateEmail(email) || !transactionReference || !message) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference: transactionReference },
      include: { 
        tickets: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              include: { admin: { select: { name: true } } }
            }
          }
        }
      }
    })

    if (!transaction || transaction.senderEmail !== email) {
      return NextResponse.json({ error: 'Transaction not found or email mismatch' }, { status: 404 })
    }

    let ticket = transaction.tickets[0]
    
    if (!ticket) {
      // Create new ticket
      ticket = await prisma.ticket.create({
        data: {
          transactionId: transaction.id,
          subject: `Support pour transaction ${transactionReference}`,
          status: 'OPEN',
          priority: 'NORMAL'
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { admin: { select: { name: true } } }
          }
        }
      })
    }

    // Add new message
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        message: message.trim(),
        isAdmin: false
      }
    })

    // Update ticket status to OPEN if it was closed
    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'OPEN', updatedAt: new Date() }
      })
    }

    return NextResponse.json({ 
      success: true,
      newMessage,
      ticket: {
        ...ticket,
        messages: [...(ticket.messages || []), newMessage]
      }
    })
  } catch (error) {
    console.error('Error processing ticket:', sanitizeForLog(error))
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

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { 
        tickets: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              include: { admin: { select: { name: true } } }
            }
          }
        }
      }
    })

    if (!transaction || transaction.senderEmail !== email) {
      return NextResponse.json({ error: 'Transaction not found or email mismatch' }, { status: 404 })
    }

    const ticket = transaction.tickets[0] || null
    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
  }
}
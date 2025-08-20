import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeForLog } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = parseInt(params.id)
    
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        transaction: {
          select: {
            reference: true,
            senderName: true,
            senderEmail: true,
            senderPhone: true,
            receiverName: true,
            amount: true,
            status: true,
            createdAt: true,
            senderCountry: { select: { name: true, currencyCode: true } },
            receiverCountry: { select: { name: true, currencyCode: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { admin: { select: { name: true } } }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket details:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
  }
}
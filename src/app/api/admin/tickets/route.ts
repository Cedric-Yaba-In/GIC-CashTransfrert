import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeForLog } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        transaction: {
          select: {
            reference: true,
            senderName: true,
            senderEmail: true,
            amount: true,
            senderCountry: { select: { name: true, currencyCode: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { admin: { select: { name: true } } }
        },
        _count: { select: { messages: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ticketId, message, status, priority } = await request.json()
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user (simplified - in production, verify JWT)
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    const updates: any = {}
    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date()
    }

    // Update ticket if needed
    if (Object.keys(updates).length > 0) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: updates
      })
    }

    // Add admin message if provided
    let newMessage = null
    if (message) {
      newMessage = await prisma.ticketMessage.create({
        data: {
          ticketId,
          message,
          isAdmin: true,
          adminId: admin.id
        },
        include: { admin: { select: { name: true } } }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: newMessage,
      updated: Object.keys(updates).length > 0
    })
  } catch (error) {
    console.error('Error updating ticket:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
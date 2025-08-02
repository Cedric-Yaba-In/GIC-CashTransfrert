import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getCurrentUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalTransactions = await prisma.transaction.count()
    const pendingTransactions = await prisma.transaction.count({
      where: { status: 'PENDING' }
    })
    const approvedTransactions = await prisma.transaction.count({
      where: { status: 'APPROVED' }
    })
    
    const volumeResult = await prisma.transaction.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ['APPROVED', 'COMPLETED'] } }
    })
    
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        senderCountry: true,
        receiverCountry: true,
      }
    })
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const dailyTransactions = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true }
    })
    
    const dailyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayTransactions = dailyTransactions.filter(t => 
        t.createdAt.toISOString().split('T')[0] === dateStr
      )
      
      dailyData.push({
        date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        count: dayTransactions.reduce((sum, t) => sum + t._count.id, 0)
      })
    }

    return NextResponse.json({
      totalTransactions,
      pendingTransactions,
      approvedTransactions,
      totalVolume: volumeResult._sum.totalAmount?.toNumber() || 0,
      recentTransactions,
      dailyTransactions: dailyData
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
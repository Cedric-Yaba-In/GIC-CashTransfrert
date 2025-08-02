import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(regions)
  } catch (error) {
    console.error('Regions API Error:', error)
    return NextResponse.json([])
  }
}
import { NextResponse } from 'next/server'
import { ConfigService } from '@/lib/config'

export async function GET() {
  try {
    const configs = await ConfigService.getAll()
    return NextResponse.json(configs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const updates = await request.json()
    await ConfigService.updateMultiple(updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update configurations' }, { status: 500 })
  }
}
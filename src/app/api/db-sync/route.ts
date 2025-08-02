import { NextResponse } from 'next/server'
import { syncDatabase } from '@/lib/db-sync'

export async function POST() {
  try {
    await syncDatabase()
    return NextResponse.json({ 
      success: true, 
      message: 'Database synchronized successfully' 
    })
  } catch (error) {
    console.error('Database sync error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to sync database' 
    }, { status: 500 })
  }
}
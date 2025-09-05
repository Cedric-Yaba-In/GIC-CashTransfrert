import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const countryId = parseInt(params.id)
    
    const countryPaymentMethod = await prisma.countryPaymentMethod.findFirst({
      where: {
        countryId,
        paymentMethod: { type: 'FLUTTERWAVE' }
      }
    })
    
    if (!countryPaymentMethod?.apiConfig) {
      return NextResponse.json({ configured: false })
    }
    
    try {
      const config = JSON.parse(countryPaymentMethod.apiConfig)
      const configured = !!(config.publicKey && config.secretKey && config.encryptionKey)
      
      return NextResponse.json({ configured })
    } catch (parseError) {
      return NextResponse.json({ configured: false })
    }
  } catch (error) {
    return NextResponse.json({ configured: false })
  }
}
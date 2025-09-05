import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { publicKey, secretKey, encryptionKey } = await request.json()

    if (!publicKey || !secretKey) {
      return NextResponse.json(
        { message: 'Clés publique et secrète requises' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.flutterwave.com/v3/banks/NG', {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    })

    if (response.ok) {
      return NextResponse.json({
        message: 'Connexion Flutterwave réussie'
      })
    } else {
      return NextResponse.json(
        { message: 'Clés Flutterwave invalides' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: `Erreur Flutterwave: ${error.message}` },
      { status: 500 }
    )
  }
}
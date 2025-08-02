import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email, transactionReference, pdfData } = await request.json()

    const result = await sendEmail({
      to: email,
      subject: `Facture - Transaction ${transactionReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Facture de transaction</h2>
          <p>Bonjour,</p>
          <p>Veuillez trouver ci-joint la facture pour votre transaction ${transactionReference}.</p>
          <p>Cordialement,<br>L'équipe GIC CashTransfer</p>
        </div>
      `,
      attachments: [
        {
          filename: `facture-${transactionReference}.pdf`,
          content: pdfData,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ]
    })

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 })
  }
}
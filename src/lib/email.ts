import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string
  subject: string
  html: string
  attachments?: any[]
}) {
  try {
    await transporter.sendMail({
      from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    })
    return { success: true }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error }
  }
}

export function getTransactionEmailTemplate(transaction: any, status: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0ea5e9, #eab308); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">${process.env.NEXT_PUBLIC_APP_NAME}</h1>
        <p style="color: white; margin: 5px 0;">${process.env.NEXT_PUBLIC_COMPANY_NAME}</p>
      </div>
      
      <div style="padding: 20px; background: #f9fafb;">
        <h2>Transaction ${status === 'approved' ? 'Approuvée' : status === 'rejected' ? 'Rejetée' : 'Mise à jour'}</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Référence:</strong> ${transaction.reference}</p>
          <p><strong>Montant:</strong> ${transaction.amount} ${transaction.senderCountry.currencyCode}</p>
          <p><strong>Expéditeur:</strong> ${transaction.senderName}</p>
          <p><strong>Destinataire:</strong> ${transaction.receiverName}</p>
          <p><strong>Statut:</strong> ${status}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/track/${transaction.reference}" 
             style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Suivre la transaction
          </a>
        </div>
      </div>
    </div>
  `
}
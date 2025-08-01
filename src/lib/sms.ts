import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function sendSMS(to: string, message: string) {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    })
    return { success: true }
  } catch (error) {
    console.error('SMS error:', error)
    return { success: false, error }
  }
}

export function getTransactionSMSMessage(transaction: any) {
  return `${process.env.NEXT_PUBLIC_APP_NAME}: Transaction ${transaction.reference} - ${transaction.amount} ${transaction.senderCountry.currencyCode}. Statut: ${transaction.status}. Suivez: ${process.env.NEXT_PUBLIC_APP_URL}/track/${transaction.reference}`
}
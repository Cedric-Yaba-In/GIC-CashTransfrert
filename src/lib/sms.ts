import twilio from 'twilio'
import { ConfigService } from './config'

export async function sendSMS(to: string, message: string) {
  try {
    const config = await ConfigService.getTwilioConfig()
    
    // Skip SMS if Twilio not configured
    if (!config.accountSid?.startsWith('AC')) {
      console.log('SMS (dev mode):', { to, message })
      return { success: true }
    }
    
    const client = twilio(config.accountSid, config.authToken)
    
    await client.messages.create({
      body: message,
      from: config.phoneNumber,
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
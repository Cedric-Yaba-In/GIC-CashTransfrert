import { Twilio } from 'twilio'
import { ConfigService } from './config'

export class SMSService {
  private static client: Twilio | null = null

  private static async getClient() {
    if (!this.client) {
      const twilioConfig = await ConfigService.getTwilioConfig()
      
      if (!twilioConfig.accountSid || !twilioConfig.authToken) {
        throw new Error('Twilio configuration missing')
      }
      
      this.client = new Twilio(twilioConfig.accountSid, twilioConfig.authToken)
    }
    return this.client
  }

  static async sendTransactionConfirmation(transaction: any) {
    try {
      const client = await this.getClient()
      const twilioConfig = await ConfigService.getTwilioConfig()
      
      const message = `GIC CashTransfer: Paiement confirmé! Transfert ${transaction.reference} de ${transaction.amount} ${transaction.senderCountry?.currencyCode} vers ${transaction.receiverName}. Suivi: ${process.env.NEXT_PUBLIC_APP_URL}/track/${transaction.reference}`

      await client.messages.create({
        body: message,
        from: twilioConfig.phoneNumber,
        to: transaction.senderPhone
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending SMS confirmation:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  static async sendReceiverNotification(transaction: any) {
    try {
      const client = await this.getClient()
      const twilioConfig = await ConfigService.getTwilioConfig()
      
      const message = `GIC CashTransfer: Vous avez reçu ${transaction.receivedAmount || 'un transfert'} ${transaction.receiverCountry?.currencyCode} de ${transaction.senderName}. Ref: ${transaction.reference}. Suivi: ${process.env.NEXT_PUBLIC_APP_URL}/track/${transaction.reference}`

      await client.messages.create({
        body: message,
        from: twilioConfig.phoneNumber,
        to: transaction.receiverPhone
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending SMS to receiver:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}
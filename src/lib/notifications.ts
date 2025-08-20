import { EmailService } from './email'
import { SMSService } from './sms'
import { sanitizeForLog } from './security'

export class NotificationService {
  static async sendPaymentConfirmation(transaction: any) {
    const results = {
      email: { success: false, error: null },
      sms: { success: false, error: null },
      receiverEmail: { success: false, error: null },
      receiverSms: { success: false, error: null }
    }

    try {
      // Email à l'expéditeur
      const emailResult = await EmailService.sendTransactionConfirmation(transaction)
      results.email = emailResult

      // SMS à l'expéditeur
      const smsResult = await SMSService.sendTransactionConfirmation(transaction)
      results.sms = smsResult

      // Email au destinataire (si email fourni)
      if (transaction.receiverEmail) {
        const receiverEmailResult = await EmailService.sendReceiverNotification(transaction)
        results.receiverEmail = receiverEmailResult
      }

      // SMS au destinataire
      const receiverSmsResult = await SMSService.sendReceiverNotification(transaction)
      results.receiverSms = receiverSmsResult

    } catch (error) {
      console.error('Notification service error:', sanitizeForLog(error))
    }

    return results
  }

  static async sendTransferCompleted(transaction: any) {
    const results = {
      email: { success: false, error: null },
      sms: { success: false, error: null },
      receiverEmail: { success: false, error: null },
      receiverSms: { success: false, error: null }
    }

    try {
      // Notifications de transfert complété
      // TODO: Créer des templates spécifiques pour transfert complété
      
    } catch (error) {
      console.error('Transfer completion notification error:', sanitizeForLog(error))
    }

    return results
  }
}
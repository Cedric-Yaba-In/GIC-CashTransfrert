import { ConfigService } from './config'

export class PaymentConfigService {
  static async isConfigured(paymentType: string): Promise<boolean> {
    try {
      switch (paymentType) {
        case 'FLUTTERWAVE':
          const config = await ConfigService.getFlutterwaveConfig()
          return !!(config.publicKey && config.secretKey)
        
        case 'BANK_TRANSFER':
          return true // Cette méthode utilise les comptes bancaires configurés
        
        default:
          return false
      }
    } catch {
      return false
    }
  }

  static getRequiredFields(paymentType: string): string[] {
    switch (paymentType) {
      case 'FLUTTERWAVE':
        return ['FLUTTERWAVE_PUBLIC_KEY', 'FLUTTERWAVE_SECRET_KEY', 'FLUTTERWAVE_WEBHOOK_HASH', 'FLUTTERWAVE_ENCRYPTION_KEY']
      default:
        return []
    }
  }
}
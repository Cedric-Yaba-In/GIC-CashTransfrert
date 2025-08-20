import { ConfigService } from './config'

export class PaymentConfigService {
  static async isConfigured(paymentType: string): Promise<boolean> {
    try {
      switch (paymentType) {
        case 'FLUTTERWAVE':
          const flutterwaveConfig = await ConfigService.getFlutterwaveConfig()
          return !!(flutterwaveConfig.publicKey && flutterwaveConfig.secretKey)
        
        case 'CINETPAY':
          const cinetpayConfig = await ConfigService.getCinetPayConfig()
          return !!(cinetpayConfig.apiKey && cinetpayConfig.siteId && cinetpayConfig.secretKey)
        
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
      case 'CINETPAY':
        return ['CINETPAY_API_KEY', 'CINETPAY_SITE_ID', 'CINETPAY_SECRET_KEY', 'CINETPAY_NOTIFY_URL']
      default:
        return []
    }
  }
}
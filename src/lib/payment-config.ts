import { ConfigService } from './config'
import { prisma } from './prisma'

export class PaymentConfigService {
  static async isConfigured(paymentType: string, countryId?: number): Promise<boolean> {
    try {
      switch (paymentType) {
        case 'FLUTTERWAVE':
          if (!countryId) return false
          
          const countryPaymentMethod = await prisma.countryPaymentMethod.findFirst({
            where: {
              countryId,
              paymentMethod: { type: 'FLUTTERWAVE' },
              active: true
            }
          })
          
          if (!countryPaymentMethod?.apiConfig) return false
          
          try {
            const config = JSON.parse(countryPaymentMethod.apiConfig)
            return !!(config.publicKey && config.secretKey)
          } catch {
            return false
          }
        
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
import { sanitizeForLog } from './security'
import { prisma } from './prisma'
import { ConfigService } from './config'

interface CinetPayConfig {
  apiKey: string
  siteId: string
  secretKey: string
  baseUrl: string
  clientBaseUrl: string
  apiPassword: string
}

interface PaymentMethod {
  method: string
  currency: string
  amount_charged_fee: number
}

interface CinetPayPaymentData {
  transaction_id: string
  amount: number
  currency: string
  notify_url: string
  return_url: string
  cancel_url: string
  customer_name: string
  customer_surname: string
  customer_email: string
  customer_phone_number: string
  customer_address: string
  customer_city: string
  customer_country: string
  customer_state: string
  customer_zip_code: string
  description: string
  channels: string
  metadata?: string
}

interface CinetPayResponse {
  code: string
  message: string
  description: string
  data: {
    payment_url: string
    payment_token: string
  }
}

interface CinetPayTransferData {
  amount: number
  currency: string
  destination_country: string
  method: string
  recipient_name: string
  recipient_phone_number: string
  reference: string
  description?: string
}

interface CinetPayTransferResponse {
  code: string
  message: string
  description: string
  data: {
    transaction_id: string
    status: string
    amount: number
    currency: string
    recipient_name: string
    recipient_phone_number: string
    fees: number
  }
}

class CinetPayService {
  private config: CinetPayConfig
  private configLoaded = false

  constructor() {
    this.config = {
      apiKey: '',
      siteId: '',
      secretKey: '',
      baseUrl: 'https://api-checkout.cinetpay.com/v2',
      clientBaseUrl: 'https://client.cinetpay.com/v1',
      apiPassword: ''
    }
  }

  private async loadConfig() {
    if (!this.configLoaded) {
      try {
        const cinetpayConfig = await ConfigService.getCinetPayConfig()
        this.config.apiKey = cinetpayConfig.apiKey || process.env.CINETPAY_API_KEY || ''
        this.config.siteId = cinetpayConfig.siteId || process.env.CINETPAY_SITE_ID || ''
        this.config.secretKey = cinetpayConfig.secretKey || process.env.CINETPAY_SECRET_KEY || ''
        this.config.apiPassword = cinetpayConfig.apiPassword || process.env.CINETPAY_API_PASSWORD || ''
        this.configLoaded = true
        console.log('CinetPay config loaded:', {
          hasApiKey: !!this.config.apiKey,
          hasSiteId: !!this.config.siteId,
          hasSecretKey: !!this.config.secretKey
        })
      } catch (error) {
        console.error('Error loading CinetPay config:', error)
        // Fallback to env variables
        this.config.apiKey = process.env.CINETPAY_API_KEY || ''
        this.config.siteId = process.env.CINETPAY_SITE_ID || ''
        this.config.secretKey = process.env.CINETPAY_SECRET_KEY || ''
        this.config.apiPassword = process.env.CINETPAY_API_PASSWORD || ''
        this.configLoaded = true
      }
    }
  }

  private async getHeaders() {
    await this.loadConfig()
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  async getPaymentMethods(currency: string): Promise<PaymentMethod[]> {
    try {
      const supportedMethods = this.getSupportedMethodsByCurrency(currency)
      console.log('Supported CinetPay methods for', sanitizeForLog(currency), ':', supportedMethods)
      
      return supportedMethods
    } catch (error) {
      console.error('Error getting CinetPay payment methods:', sanitizeForLog(error))
      return []
    }
  }

  private getSupportedMethodsByCurrency(currency: string): PaymentMethod[] {
    const methods: PaymentMethod[] = []
    
    // Méthodes communes
    methods.push({
      method: 'CARD',
      currency: currency,
      amount_charged_fee: 0
    })
    
    // Méthodes spécifiques par devise/région CinetPay
    switch (currency.toUpperCase()) {
      case 'XOF': // West Africa CFA
      case 'XAF': // Central Africa CFA
        methods.push(
          { method: 'ORANGE_MONEY_CI', currency, amount_charged_fee: 0 },
          { method: 'MOOV_CI', currency, amount_charged_fee: 0 },
          { method: 'MTN_CI', currency, amount_charged_fee: 0 },
          { method: 'WAVE_CI', currency, amount_charged_fee: 0 }
        )
        break
      case 'GHS': // Ghana
        methods.push(
          { method: 'MTN_GH', currency, amount_charged_fee: 0 },
          { method: 'VODAFONE_GH', currency, amount_charged_fee: 0 },
          { method: 'AIRTELTIGO_GH', currency, amount_charged_fee: 0 }
        )
        break
      case 'USD':
      case 'EUR':
        methods.push(
          { method: 'PAYPAL', currency, amount_charged_fee: 0 }
        )
        break
      default:
        // Pour les autres devises, on propose au moins les cartes
        break
    }
    
    return methods
  }

  async createPayment(paymentData: CinetPayPaymentData): Promise<CinetPayResponse | null> {
    try {
      await this.loadConfig()
      
      const requestData = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        ...paymentData
      }

      const response = await fetch(`${this.config.baseUrl}/payment`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      
      if (data.code === '201') {
        return data
      }
      
      console.error('CinetPay payment creation failed:', sanitizeForLog(data))
      return null
    } catch (error) {
      console.error('Error creating CinetPay payment:', sanitizeForLog(error))
      return null
    }
  }

  async createTransfer(transferData: CinetPayTransferData): Promise<CinetPayTransferResponse | null> {
    try {
      // Utiliser l'API client avec authentification
      const token = await this.getAuthToken()
      
      if (!token) {
        console.error('Unable to authenticate for transfer')
        return null
      }
      
      const formData = new URLSearchParams()
      formData.append('token', token)
      formData.append('amount', transferData.amount.toString())
      formData.append('currency', transferData.currency)
      formData.append('destination_country', transferData.destination_country)
      formData.append('method', transferData.method)
      formData.append('recipient_name', transferData.recipient_name)
      formData.append('recipient_phone_number', transferData.recipient_phone_number)
      formData.append('reference', transferData.reference)
      if (transferData.description) {
        formData.append('description', transferData.description)
      }
      formData.append('lang', 'fr') // TODO: Make language configurable

      const response = await fetch(`${this.config.clientBaseUrl}/transfer/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      })

      const data = await response.json()
      
      if (data.code === 0) {
        return data
      }
      
      console.error('CinetPay transfer creation failed:', sanitizeForLog(data))
      return null
    } catch (error) {
      console.error('Error creating CinetPay transfer:', sanitizeForLog(error))
      return null
    }
  }

  async verifyPayment(transactionId: string): Promise<any> {
    try {
      await this.loadConfig()
      
      const requestData = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId
      }

      const response = await fetch(`${this.config.baseUrl}/payment/check`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      
      if (data.code === '00') {
        return data.data
      }
      
      return null
    } catch (error) {
      console.error('Error verifying CinetPay payment:', sanitizeForLog(error))
      return null
    }
  }

  generateTxRef(): string {
    return `CINETPAY_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      await this.loadConfig()
      
      if (!this.config.apiKey || !this.config.apiPassword) {
        console.error('CinetPay API key or password missing')
        return null
      }

      // console.log("Config ",this.config)
      const formData = new URLSearchParams()
      formData.append('apikey', this.config.apiKey)
      formData.append('password', this.config.apiPassword)
      // formData.append('lang', 'fr')

      const response = await fetch(`${this.config.clientBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      })

      const data = await response.json()
      
      if (data.code === 0 && data.data?.token) {
        console.log('CinetPay authentication successful')
        return data.data.token
      }
      
      console.error('CinetPay authentication failed:', sanitizeForLog(data))
      return null
    } catch (error) {
      console.error('CinetPay authentication error:', sanitizeForLog(error))
      return null
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getAuthToken()
      
      if (token) {
        return { success: true, message: 'Connexion CinetPay réussie' }
      } else {
        return { success: false, message: 'Échec de l\'authentification CinetPay' }
      }
    } catch (error) {
      return { success: false, message: `Erreur de connexion: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  async getBalance(currency: string): Promise<number | null> {
    try {
      console.log('Fetching CinetPay balance from API for currency:', currency)
      
      // Étape 1: Obtenir le token d'authentification
      const token = await this.getAuthToken()
      
      if (!token) {
        console.error('Unable to authenticate with CinetPay - check API credentials')
        return null
      }
      

      let subAccount = await fetch(`https://api-checkout.cinetpay.com/v2/account/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body:JSON.stringify({
        "apikey":this.config.apiKey,
        "site_id":this.config.siteId
      })
    });
    console.log("SubAccount", await subAccount.json())


      // Étape 2: Récupérer le solde avec le token depuis l'API CinetPay
      const balanceUrl = `${this.config.clientBaseUrl}/transfer/check/balance?token=${encodeURIComponent(token)}&lang=fr`
      
      // console.log('Calling CinetPay balance API:', balanceUrl)
      const response = await fetch(balanceUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })


      
      const data = await response.json()
      console.log('CinetPay API response:', sanitizeForLog(data))
      
      if (data.code === 0 && data.data) {
        const availableBalance = parseFloat(data.data.available) || 0
        console.log(`CinetPay API balance retrieved for ${currency}:`, {
          total: data.data.amount,
          inUsing: data.data.inUsing,
          available: availableBalance
        })
        
        return availableBalance
      } else {
        console.error('CinetPay balance API error:', sanitizeForLog(data))
        return null
      }
      
    } catch (error) {
      console.error('Error calling CinetPay balance API:', sanitizeForLog(error))
      return null
    }
  }

  async processTransferToReceiver(transactionId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          senderCountry: true,
          receiverCountry: true
        }
      })

      if (!transaction) {
        return { success: false, error: 'Transaction non trouvée' }
      }

      const adminNotes = transaction.adminNotes ? JSON.parse(transaction.adminNotes) : {}
      
      const transferData: CinetPayTransferData = {
        amount: transaction.amount.toNumber(),
        currency: transaction.receiverCountry.currencyCode,
        destination_country: transaction.receiverCountry.code,
        method: adminNotes.receiverSubMethod || 'ORANGE_MONEY_CI',
        recipient_name: `${adminNotes.receiverFirstName || ''} ${adminNotes.receiverLastName || ''}`.trim(),
        recipient_phone_number: adminNotes.receiverPhone || '',
        reference: `TRANSFER_${transaction.reference}`,
        description: `Transfert GIC CashTransfer - ${transaction.reference}`
      }

      const result = await this.createTransfer(transferData)
      
      if (result) {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED' as any,
            adminNotes: JSON.stringify({
              ...adminNotes,
              cinetpayTransferId: result.data.transaction_id,
              transferMethod: 'CINETPAY',
              transferCompletedAt: new Date().toISOString()
            })
          }
        })

        return { success: true }
      }

      return { success: false, error: 'Échec du transfert CinetPay' }
    } catch (error) {
      console.error('Error processing CinetPay transfer:', sanitizeForLog(error))
      return { success: false, error: 'Erreur lors du transfert' }
    }
  }
}

export const cinetPayService = new CinetPayService()
export { CinetPayService }
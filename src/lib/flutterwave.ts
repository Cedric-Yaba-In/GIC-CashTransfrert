import { sanitizeForLog } from './security'
import { prisma } from './prisma'
import { ConfigService } from './config'

interface FlutterwaveConfig {
  publicKey: string
  secretKey: string
  baseUrl: string
}

interface PaymentMethod {
  method: string
  currency: string
  amount_charged_fee: number
}

interface FlutterwavePaymentData {
  tx_ref: string
  amount: number
  currency: string
  redirect_url: string
  customer: {
    email: string
    phonenumber: string
    name: string
  }
  customizations: {
    title: string
    description: string
    logo: string
  }
  payment_options: string
  meta: {
    consumer_id: string
    consumer_mac: string
    transaction_id?: string
  }
}

interface FlutterwaveResponse {
  status: string
  message: string
  data: {
    link: string
    payment_id: string
  }
}

interface FlutterwaveTransferData {
  account_bank: string
  account_number: string
  amount: number
  currency: string
  narration: string
  reference: string
  beneficiary_name?: string
}

interface FlutterwaveTransferResponse {
  status: string
  message: string
  data: {
    id: number
    account_number: string
    bank_code: string
    full_name: string
    created_at: string
    currency: string
    debit_currency: string
    amount: number
    fee: number
    status: string
    reference: string
    meta: any
    narration: string
    complete_message: string
    requires_approval: number
    is_approved: number
    bank_name: string
  }
}

class FlutterwaveService {
  private config: FlutterwaveConfig
  private configLoaded = false

  constructor() {
    this.config = {
      publicKey: '',
      secretKey: '',
      baseUrl: 'https://api.flutterwave.com/v3'
    }
  }

  private async loadConfig() {
    if (!this.configLoaded) {
      try {
        const flutterwaveConfig = await ConfigService.getFlutterwaveConfig()
        this.config.publicKey = flutterwaveConfig.publicKey || process.env.FLUTTERWAVE_PUBLIC_KEY || ''
        this.config.secretKey = flutterwaveConfig.secretKey || process.env.FLUTTERWAVE_SECRET_KEY || ''
        this.configLoaded = true
        console.log('Flutterwave config loaded:', {
          hasPublicKey: !!this.config.publicKey,
          hasSecretKey: !!this.config.secretKey
        })
      } catch (error) {
        console.error('Error loading Flutterwave config:', error)
        // Fallback to env variables
        this.config.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || ''
        this.config.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || ''
        this.configLoaded = true
      }
    }
  }

  private async getHeaders() {
    await this.loadConfig()
    return {
      'Authorization': `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/json'
    }
  }

  async getPaymentMethods(currency: string): Promise<PaymentMethod[]> {
    try {
      await this.loadConfig()
      console.log('Getting payment methods for currency:', currency)
      
      // Flutterwave n'a pas d'endpoint payment-methods
      // On retourne les méthodes supportées selon la devise
      const supportedMethods = this.getSupportedMethodsByCurrency(currency)
      console.log('Supported methods for', currency, ':', supportedMethods)
      
      return supportedMethods
    } catch (error) {
      console.error('Error getting payment methods:', sanitizeForLog(error))
      return []
    }
  }

  private getSupportedMethodsByCurrency(currency: string): PaymentMethod[] {
    const methods: PaymentMethod[] = []
    
    // Méthodes communes à toutes les devises
    methods.push({
      method: 'card',
      currency: currency,
      amount_charged_fee: 0
    })
    
    // Méthodes spécifiques par devise/région
    switch (currency.toUpperCase()) {
      case 'NGN': // Nigeria
        methods.push(
          { method: 'banktransfer', currency, amount_charged_fee: 0 },
          { method: 'ussd', currency, amount_charged_fee: 0 },
          { method: 'mobilemoney', currency, amount_charged_fee: 0 }
        )
        break
      case 'GHS': // Ghana
      case 'KES': // Kenya
      case 'UGX': // Uganda
      case 'TZS': // Tanzania
      case 'RWF': // Rwanda
        methods.push(
          { method: 'mobilemoney', currency, amount_charged_fee: 0 },
          { method: 'banktransfer', currency, amount_charged_fee: 0 }
        )
        break
      case 'XOF': // West Africa CFA
      case 'XAF': // Central Africa CFA
        methods.push(
          { method: 'mobilemoney', currency, amount_charged_fee: 0 },
          { method: 'banktransfer', currency, amount_charged_fee: 0 }
        )
        break
      case 'USD':
      case 'EUR':
      case 'GBP':
        methods.push(
          { method: 'banktransfer', currency, amount_charged_fee: 0 }
        )
        break
      default:
        // Pour les autres devises, on propose au moins les cartes
        break
    }
    
    return methods
  }

  async getBanks(country: string): Promise<any[]> {
    try {
      await this.loadConfig()
      const response = await fetch(`${this.config.baseUrl}/banks/${country}`, {
        headers: await this.getHeaders()
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data || []
      }
      
      return []
    } catch (error) {
      console.error('Error fetching banks:', sanitizeForLog(error))
      return []
    }
  }

  async createPayment(paymentData: FlutterwavePaymentData): Promise<FlutterwaveResponse | null> {
    try {
      await this.loadConfig()
      const response = await fetch(`${this.config.baseUrl}/payments`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(paymentData)
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        return data
      }
      
      console.error('Flutterwave payment creation failed:', sanitizeForLog(data))
      return null
    } catch (error) {
      console.error('Error creating Flutterwave payment:', sanitizeForLog(error))
      return null
    }
  }

  async createTransfer(transferData: FlutterwaveTransferData): Promise<FlutterwaveTransferResponse | null> {
    try {
      await this.loadConfig()
      const response = await fetch(`${this.config.baseUrl}/transfers`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(transferData)
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        return data
      }
      
      // Check for IP whitelisting error
      if (data.message && data.message.includes('IP Whitelisting')) {
        console.warn('IP Whitelisting required for Flutterwave transfers')
        throw new Error('IP_WHITELISTING_REQUIRED')
      }
      
      console.error('Flutterwave transfer creation failed:', sanitizeForLog(data))
      return null
    } catch (error) {
      if (error.message === 'IP_WHITELISTING_REQUIRED') {
        throw error
      }
      console.error('Error creating Flutterwave transfer:', sanitizeForLog(error))
      return null
    }
  }

  async verifyAccountNumber(accountNumber: string, bankCode: string): Promise<any> {
    try {
      await this.loadConfig()
      const response = await fetch(`${this.config.baseUrl}/accounts/resolve`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          account_number: accountNumber,
          account_bank: bankCode
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      return null
    } catch (error) {
      console.error('Error verifying account number:', sanitizeForLog(error))
      return null
    }
  }

  async verifyPayment(transactionId: string): Promise<any> {
    try {
      await this.loadConfig()
      const response = await fetch(`${this.config.baseUrl}/transactions/${transactionId}/verify`, {
        headers: await this.getHeaders()
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      return null
    } catch (error) {
      console.error('Error verifying Flutterwave payment:', sanitizeForLog(error))
      return null
    }
  }

  async getSupportedCountries(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/countries`, {
        headers: await this.getHeaders()
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data || []
      }
      
      return []
    } catch (error) {
      console.error('Error fetching supported countries:', sanitizeForLog(error))
      return []
    }
  }

  generateTxRef(): string {
    return `GIC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async processTransferToReceiver(transactionId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          senderCountry: true,
          receiverCountry: true,
          receiverPaymentMethod: true
        }
      })

      if (!transaction) {
        return { success: false, error: 'Transaction not found' }
      }

      if (transaction.status !== 'APPROVED') {
        return { success: false, error: 'Transaction not approved' }
      }

      // Parse admin notes to get receiver payment info
      let adminNotes: any = {}
      try {
        adminNotes = typeof transaction.adminNotes === 'string' 
          ? JSON.parse(transaction.adminNotes) 
          : transaction.adminNotes || {}
      } catch (e) {
        console.error('Error parsing admin notes:', e)
      }

      const receiverSubMethod = transaction.receiverSubMethod || adminNotes.flutterwaveOption
      const receiverPaymentInfo = adminNotes.receiverPaymentInfo || {}
      const paymentMethodType = transaction.receiverPaymentMethod?.type

      console.log('Processing transfer with:', {
        receiverSubMethod,
        flutterwaveOption: adminNotes.flutterwaveOption,
        receiverPaymentInfo,
        paymentMethodType
      })

      if (paymentMethodType !== 'FLUTTERWAVE') {
        return { success: false, error: `Unsupported receiver payment method: ${paymentMethodType}` }
      }

      // Prepare transfer data based on sub-method
      let transferData: FlutterwaveTransferData

      if (receiverSubMethod === 'mobilemoney') {
        transferData = {
          account_bank: 'MPS', // Mobile Payment Service
          account_number: receiverPaymentInfo.phoneNumber || transaction.receiverPhone,
          amount: transaction.receiverAmount,
          currency: transaction.receiverCountry.currency,
          narration: `Transfer from ${transaction.senderName}`,
          reference: `GIC_TRANSFER_${transaction.id}_${Date.now()}`
        }
      } else if (receiverSubMethod === 'banktransfer') {
        transferData = {
          account_bank: receiverPaymentInfo.bankCode,
          account_number: receiverPaymentInfo.accountNumber,
          amount: transaction.receiverAmount,
          currency: transaction.receiverCountry.currency,
          narration: `Transfer from ${transaction.senderName}`,
          reference: `GIC_TRANSFER_${transaction.id}_${Date.now()}`,
          beneficiary_name: receiverPaymentInfo.accountName || transaction.receiverName
        }
      } else {
        return { success: false, error: `Unsupported receiver sub-method: ${receiverSubMethod}` }
      }

      try {
        const transferResult = await this.createTransfer(transferData)
        
        if (transferResult) {
          // Update transaction with transfer details
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: 'COMPLETED',
              flutterwaveRef: transferResult.data.reference,
              adminNotes: JSON.stringify({
                ...adminNotes,
                transferResult: {
                  id: transferResult.data.id,
                  reference: transferResult.data.reference,
                  status: transferResult.data.status,
                  amount: transferResult.data.amount,
                  fee: transferResult.data.fee
                }
              })
            }
          })

          return { success: true }
        } else {
          return { success: false, error: 'Transfer creation failed' }
        }
      } catch (error) {
        if (error.message === 'IP_WHITELISTING_REQUIRED') {
          // Mark transaction for manual processing instead of failing
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              adminNotes: JSON.stringify({
                ...adminNotes,
                manualProcessingRequired: true,
                ipWhitelistingError: true,
                transferData: transferData,
                errorMessage: 'IP Whitelisting required - manual processing needed'
              })
            }
          })
          
          return { success: false, error: 'IP Whitelisting required - marked for manual processing' }
        }
        throw error
      }
    } catch (error) {
      console.error('Error processing transfer to receiver:', sanitizeForLog(error))
      return { success: false, error: error.message || 'Transfer processing failed' }
    }
  }

  async processPaymentForTransaction(transactionId: number): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          senderCountry: true,
          receiverCountry: true,
          senderPaymentMethod: true
        }
      })

      if (!transaction) {
        return { success: false, error: 'Transaction not found' }
      }

      if (transaction.senderPaymentMethod.type !== 'FLUTTERWAVE') {
        return { success: false, error: 'Payment method is not Flutterwave' }
      }

      const tx_ref = `${transaction.reference}_${Date.now()}`
      
      const paymentData: FlutterwavePaymentData = {
        tx_ref: tx_ref,
        amount: transaction.totalAmount.toNumber(),
        currency: transaction.senderCountry.currencyCode,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/transfer/payment/callback?ref=${tx_ref}`,
        customer: {
          email: transaction.senderEmail,
          phonenumber: transaction.senderPhone,
          name: transaction.senderName
        },
        customizations: {
          title: 'GIC CashTransfer',
          description: `Transfert vers ${transaction.receiverName}`,
          logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
        },
        payment_options: this.getPaymentOptionsForCountry(transaction.senderCountry.code),
        meta: {
          consumer_id: transaction.senderEmail,
          consumer_mac: transaction.reference,
          transaction_id: transaction.id.toString()
        }
      }

      const result = await this.createPayment(paymentData)
      
      if (result) {
        return { success: true, paymentUrl: result.data.link }
      } else {
        return { success: false, error: 'Failed to create payment' }
      }
    } catch (error) {
      console.error('Error processing payment for transaction:', sanitizeForLog(error))
      return { success: false, error: 'Internal server error' }
    }
  }

  private getPaymentOptionsForCountry(countryCode: string): string {
    const countryPaymentOptions: { [key: string]: string } = {
      'NG': 'card,banktransfer,ussd,mobilemoney',
      'GH': 'card,mobilemoney',
      'KE': 'card,mobilemoney',
      'UG': 'card,mobilemoney',
      'TZ': 'card,mobilemoney',
      'RW': 'card,mobilemoney',
      'ZM': 'card,mobilemoney',
      'CI': 'card,mobilemoney',
      'SN': 'card,mobilemoney',
      'BF': 'card,mobilemoney',
      'ML': 'card,mobilemoney',
      'default': 'card'
    }

    return countryPaymentOptions[countryCode] || countryPaymentOptions['default']
  }
}

export const flutterwaveService = new FlutterwaveService()
export type { PaymentMethod, FlutterwavePaymentData, FlutterwaveResponse, FlutterwaveTransferData, FlutterwaveTransferResponse }
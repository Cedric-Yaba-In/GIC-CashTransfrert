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
  private baseUrl = 'https://api.flutterwave.com/v3'
  private countryConfigs = new Map<number, FlutterwaveConfig>()

  constructor() {}

  // Fonction utilitaire pour nettoyer les numéros de téléphone
  private cleanPhoneNumber(phoneNumber: string, callingCode?: string): string {
    console.log('Cleaning phone number:', phoneNumber, 'with calling code:', callingCode)
    
    if (!phoneNumber) return phoneNumber
    
    let cleaned = phoneNumber.trim()
    cleaned = cleaned.replace(" ","").replace("+", "");
    
    // Si le numéro commence par +, supprimer l'indicatif pays
    // if (cleaned.startsWith('+') && callingCode) {
    //   if (cleaned.startsWith(callingCode)) {
    //     cleaned = cleaned.substring(callingCode.length).trim()
    //     console.log('Cleaned phone number:', cleaned)
    //   }
    // }
    
    return cleaned
  }

  private async loadCountryConfig(countryId: number): Promise<FlutterwaveConfig | null> {
    if (this.countryConfigs.has(countryId)) {
      return this.countryConfigs.get(countryId)!
    }

    try {
      const countryPaymentMethod = await prisma.countryPaymentMethod.findFirst({
        where: {
          countryId,
          paymentMethod: { type: 'FLUTTERWAVE' },
          active: true
        }
      })

      if (!countryPaymentMethod?.apiConfig) {
        return null
      }

      const config = JSON.parse(countryPaymentMethod.apiConfig) as FlutterwaveConfig
      this.countryConfigs.set(countryId, config)
      return config
    } catch (error) {
      console.error(`Error loading Flutterwave config for country ${countryId}:`, error)
      return null
    }
  }

  private async getHeaders(countryId: number) {
    const config = await this.loadCountryConfig(countryId)
    
    if (!config?.secretKey) {
      throw new Error(`Flutterwave not configured for country ${countryId}`)
    }
    
    return {
      'Authorization': `Bearer ${config.secretKey}`,
      'Content-Type': 'application/json'
    }
  }

  async getPaymentMethods(currency: string): Promise<PaymentMethod[]> {
    try {
      // Flutterwave n'a pas d'endpoint payment-methods
      // On retourne les méthodes supportées selon la devise
      const supportedMethods = this.getSupportedMethodsByCurrency(currency)
      console.log('Supported methods for', sanitizeForLog(currency), ':', supportedMethods)
      
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

  async getBanks(countryId: number, countryCode: string): Promise<any[]> {
    try {
      const headers = await this.getHeaders(countryId)
      
      const response = await fetch(`${this.baseUrl}/banks/${countryCode}`, {
        headers
      })

      if (!response.ok) {
        console.error(`Flutterwave API error: ${response.status} ${response.statusText}`)
        return []
      }

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

  async createPayment(countryId: number, paymentData: FlutterwavePaymentData): Promise<FlutterwaveResponse | null> {
    try {
      const headers = await this.getHeaders(countryId)
      
      // Nettoyer le numéro de téléphone pour Flutterwave
      const country = await prisma.country.findUnique({ where: { id: countryId } })
      if (country?.callingCode && paymentData.customer.phonenumber) {
        paymentData.customer.phonenumber = this.cleanPhoneNumber(
          paymentData.customer.phonenumber, 
          country.callingCode
        )
      }
      
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers,
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

  async createTransfer(countryId: number, transferData: FlutterwaveTransferData): Promise<FlutterwaveTransferResponse | null> {
    try {
      const headers = await this.getHeaders(countryId)
      const response = await fetch(`${this.baseUrl}/transfers`, {
        method: 'POST',
        headers,
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
      
      console.error('Flutterwave transfer creation failed:',data, sanitizeForLog(data))
      throw new Error(data.message)
    } catch (error) {
      if (error instanceof Error) { // && error.message === 'IP_WHITELISTING_REQUIRED'
        throw error
      }
      console.error('Error creating Flutterwave transfer:', sanitizeForLog(error))
      return null
    }
  }

  async verifyAccountNumber(countryId: number, accountNumber: string, bankCode: string): Promise<any> {
    try {
      const headers = await this.getHeaders(countryId)
      const response = await fetch(`${this.baseUrl}/accounts/resolve`, {
        method: 'POST',
        headers,
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

  async verifyPayment(countryId: number, transactionId: string): Promise<any> {
    try {
      const headers = await this.getHeaders(countryId)
      console.log('Verifying Flutterwave payment:', transactionId)
      
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers
      })

      const data = await response.json()
      console.log('Flutterwave verification response:', sanitizeForLog(data))
      
      if (data.status === 'success' && data.data) {
        console.log('Payment verification successful:', {
          status: data.data.status,
          amount: data.data.amount,
          currency: data.data.currency
        })
        return data.data
      }
      
      console.error('Payment verification failed:', sanitizeForLog(data))
      return null
    } catch (error) {
      console.error('Error verifying Flutterwave payment:', sanitizeForLog(error))
      return null
    }
  }



  generateTxRef(): string {
    return `GIC_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  async getBalance(countryId: number): Promise<{ totalBalance: number; balancesByCurrency: any[] } | null> {
    try {
      const headers = await this.getHeaders(countryId)
      
      const response = await fetch(`${this.baseUrl}/balances`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        console.error(`Flutterwave API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json()
      console.log('Flutterwave balances response:', sanitizeForLog(data))
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        const balances = data.data.map((b: any) => ({
          currency: b.currency,
          availableBalance: parseFloat(b.available_balance) || 0,
          ledgerBalance: parseFloat(b.ledger_balance) || 0
        }))
        
        // Calculer le solde total en USD (ou devise de référence)
        const totalBalance = balances.reduce((sum: number, b: any) => sum + b.availableBalance, 0)
        
        return {
          totalBalance,
          balancesByCurrency: balances
        }
      }
      
      console.error('Flutterwave balance API returned error:', sanitizeForLog(data))
      return null
    } catch (error) {
      console.error(`Error getting Flutterwave balance for country ${countryId}:`, sanitizeForLog(error))
      return null
    }
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
        receiverPaymentData:transaction.receiverName,
        paymentMethodType
      })

      if (paymentMethodType !== 'FLUTTERWAVE') {
        return { success: false, error: `Unsupported receiver payment method: ${paymentMethodType}` }
      }

      // Prepare transfer data based on sub-method
      let transferData: FlutterwaveTransferData
      const ref = `GIC_TRANSFER_${transaction.id}_${Date.now()}`;

      if (receiverSubMethod === 'mobilemoney') {
        // Pour mobile money, nettoyer le numéro de téléphone
        const rawPhoneNumber = receiverPaymentInfo.phoneNumber || transaction.receiverPhone
        const cleanedPhoneNumber = this.cleanPhoneNumber(rawPhoneNumber, transaction.receiverCountry.callingCode || undefined)
        console.log("Transfered data ",{
          account_bank: 'MPS', // Mobile Payment Service
          account_number: cleanedPhoneNumber,
          amount: transaction.amount.toNumber(),
          currency: transaction.receiverCountry.currencyCode,
          narration: ref,
          reference: ref
        })
        transferData = {
          account_bank: 'MPS', // Mobile Payment Service
          account_number: cleanedPhoneNumber,
          amount: transaction.amount.toNumber(),
          currency: transaction.receiverCountry.currencyCode,
          beneficiary_name: transaction.receiverName,
          narration: ref,
          reference: ref
        }
      } else if (receiverSubMethod === 'banktransfer') {
        transferData = {
          account_bank: receiverPaymentInfo.bankCode,
          account_number: receiverPaymentInfo.accountNumber,
          amount: transaction.amount.toNumber(),
          currency: transaction.receiverCountry.currencyCode,
          narration: ref,//,`Transfer from ${transaction.senderName}`,
          reference: ref,
          beneficiary_name: receiverPaymentInfo.accountName || transaction.receiverName
        }
      } else {
        return { success: false, error: `Unsupported receiver sub-method: ${receiverSubMethod}` }
      }

      try {
        const transferResult = await this.createTransfer(transaction.receiverCountryId, transferData)
        
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
        if (error instanceof Error && error.message === 'IP_WHITELISTING_REQUIRED') {
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
      return { success: false, error: error instanceof Error ? error.message : 'Transfer processing failed' }
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

      const result = await this.createPayment(transaction.senderCountryId, paymentData)
      
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
export { FlutterwaveService }
export type { PaymentMethod, FlutterwavePaymentData, FlutterwaveResponse, FlutterwaveTransferData, FlutterwaveTransferResponse }
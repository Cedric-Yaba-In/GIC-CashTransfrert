import { sanitizeForLog } from './security'

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

class FlutterwaveService {
  private config: FlutterwaveConfig

  constructor() {
    this.config = {
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
      baseUrl: 'https://api.flutterwave.com/v3'
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/json'
    }
  }

  async getPaymentMethods(currency: string): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/payment-methods?currency=${currency}`, {
        headers: this.getHeaders()
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data || []
      }
      
      return []
    } catch (error) {
      console.error('Error fetching Flutterwave payment methods:', sanitizeForLog(error))
      return []
    }
  }

  async createPayment(paymentData: FlutterwavePaymentData): Promise<FlutterwaveResponse | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/payments`, {
        method: 'POST',
        headers: this.getHeaders(),
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

  async verifyPayment(transactionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transactions/${transactionId}/verify`, {
        headers: this.getHeaders()
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
        headers: this.getHeaders()
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
}

export const flutterwaveService = new FlutterwaveService()
export type { PaymentMethod, FlutterwavePaymentData, FlutterwaveResponse }
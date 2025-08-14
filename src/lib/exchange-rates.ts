interface ExchangeRateResponse {
  result: string
  base_code: string
  target_code: string
  conversion_rate: number
  time_last_update_unix: number
}

interface ExchangeRatesResponse {
  result: string
  base_code: string
  conversion_rates: Record<string, number>
  time_last_update_unix: number
}

export class ExchangeRateService {
  private static readonly BASE_URL = 'https://api.exchangerate-api.com/v4/latest'
  private static readonly FALLBACK_URL = 'https://open.er-api.com/v6/latest'
  
  static async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return 1
    
    try {
      // Essayer l'API principale
      const response = await fetch(`${this.BASE_URL}/${fromCurrency}`)
      if (response.ok) {
        const data: ExchangeRatesResponse = await response.json()
        if (data.conversion_rates && data.conversion_rates[toCurrency]) {
          return data.conversion_rates[toCurrency]
        }
      }
      
      // Essayer l'API de fallback
      const fallbackResponse = await fetch(`${this.FALLBACK_URL}/${fromCurrency}`)
      if (fallbackResponse.ok) {
        const fallbackData: any = await fallbackResponse.json()
        if (fallbackData.rates && fallbackData.rates[toCurrency]) {
          return fallbackData.rates[toCurrency]
        }
      }
      
      throw new Error('Taux non trouvé')
    } catch (error) {
      console.error('Erreur récupération taux de change:', error)
      return this.getFallbackRate(fromCurrency, toCurrency)
    }
  }
  
  static async getAllRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${this.BASE_URL}/${baseCurrency}`)
      if (response.ok) {
        const data: ExchangeRatesResponse = await response.json()
        if (data.conversion_rates) {
          return data.conversion_rates
        }
      }
      
      const fallbackResponse = await fetch(`${this.FALLBACK_URL}/${baseCurrency}`)
      if (fallbackResponse.ok) {
        const fallbackData: any = await fallbackResponse.json()
        if (fallbackData.rates) {
          return fallbackData.rates
        }
      }
      
      throw new Error('APIs indisponibles')
    } catch (error) {
      console.error('Erreur récupération tous les taux:', error)
      return this.getFallbackRates()
    }
  }
  
  private static getFallbackRate(from: string, to: string): number {
    const fallbackRates: Record<string, Record<string, number>> = {
      'USD': {
        'EUR': 0.85, 'GBP': 0.73, 'XOF': 590, 'XAF': 590, 'NGN': 460,
        'GHS': 6.2, 'KES': 110, 'UGX': 3700, 'TZS': 2300, 'RWF': 1050,
        'MAD': 9.8, 'TND': 3.1, 'EGP': 31, 'ZAR': 18.5, 'CAD': 1.35,
        'AUD': 1.52, 'JPY': 150, 'CHF': 0.88, 'CNY': 7.2
      },
      'EUR': {
        'USD': 1.18, 'GBP': 0.86, 'XOF': 655, 'XAF': 655, 'NGN': 540,
        'GHS': 7.3, 'KES': 130, 'UGX': 4350, 'TZS': 2700, 'RWF': 1235
      }
    }
    
    // Essayer le taux direct
    if (fallbackRates[from]?.[to]) {
      return fallbackRates[from][to]
    }
    
    // Essayer le taux inverse
    if (fallbackRates[to]?.[from]) {
      return 1 / fallbackRates[to][from]
    }
    
    // Conversion via USD
    if (from !== 'USD' && to !== 'USD') {
      const fromToUsd = fallbackRates[from]?.['USD'] || (fallbackRates['USD'][from] ? 1 / fallbackRates['USD'][from] : 1)
      const usdToTo = fallbackRates['USD'][to] || (fallbackRates[to]?.['USD'] ? 1 / fallbackRates[to]['USD'] : 1)
      return fromToUsd * usdToTo
    }
    
    return 1
  }
  
  private static getFallbackRates(): Record<string, number> {
    return {
      'EUR': 0.85,
      'GBP': 0.73,
      'XOF': 590,
      'XAF': 590,
      'NGN': 460,
      'GHS': 6.2,
      'KES': 110,
      'UGX': 3700,
      'TZS': 2300,
      'RWF': 1050,
      'MAD': 9.8,
      'TND': 3.1,
      'EGP': 31,
      'ZAR': 18.5
    }
  }
}
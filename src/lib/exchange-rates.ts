// Service pour récupérer les taux de change
export class ExchangeRateService {
  // Taux de change fixes approximatifs (USD vers autres devises)
  private static FIXED_RATES: Record<string, number> = {
    'USD': 1,
    'EUR': 0.85,
    'GBP': 0.73,
    'NGN': 800,
    'XOF': 600,
    'XAF': 600,
    'GHS': 12,
    'KES': 150,
    'UGX': 3700,
    'TZS': 2500,
    'RWF': 1300,
    'ZAR': 18,
    'EGP': 31,
    'MAD': 10
  }

  static getExchangeRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1

    // Convertir via USD
    const fromToUSD = 1 / (this.FIXED_RATES[fromCurrency] || 1)
    const usdToTarget = this.FIXED_RATES[toCurrency] || 1
    
    return fromToUSD * usdToTarget
  }

  static convertToCountryCurrency(
    balances: Array<{ currency: string; availableBalance: number }>,
    targetCurrency: string
  ): number {
    let totalInTargetCurrency = 0

    for (const balance of balances) {
      const rate = this.getExchangeRate(balance.currency, targetCurrency)
      totalInTargetCurrency += balance.availableBalance * rate
    }

    return totalInTargetCurrency
  }
}
import { prisma } from '@/lib/prisma'

export interface TransferRateCalculation {
  baseFee: number
  percentageFee: number
  totalFees: number
  exchangeRate: number
  exchangeRateMargin: number
  finalExchangeRate: number
  minAmount: number
  maxAmount: number | null
  source: 'corridor' | 'country' | 'global' | 'default'
}

export class TransferRateService {
  /**
   * Calcule les taux de transfert selon la hiérarchie :
   * 1. Corridor spécifique (pays A → pays B)
   * 2. Taux par pays (expéditeur ou destinataire)
   * 3. Taux global par défaut
   */
  static async calculateTransferRate(
    senderCountryId: number,
    receiverCountryId: number,
    amount: number,
    paymentMethodId?: number
  ): Promise<TransferRateCalculation> {
    
    // 1. Vérifier s'il existe un corridor spécifique
    const corridor = await prisma.transferCorridor.findFirst({
      where: {
        senderCountryId,
        receiverCountryId,
        active: true
      },
      include: {
        transferRate: true,
        senderCountry: true,
        receiverCountry: true
      }
    })

    if (corridor && corridor.active) {
      const rate = await this.buildRateFromCorridor(corridor, amount)
      if (rate) return { ...rate, source: 'corridor' }
    }

    // 2. Vérifier les taux par pays (expéditeur d'abord)
    const senderRate = await prisma.countryTransferRate.findFirst({
      where: {
        countryId: senderCountryId,
        active: true
      },
      include: {
        transferRate: true,
        country: true
      }
    })

    if (senderRate) {
      const rate = await this.buildRateFromCountryRate(senderRate, amount, senderCountryId, receiverCountryId)
      if (rate) return { ...rate, source: 'country' }
    }

    // 3. Taux global par défaut
    const globalRate = await prisma.transferRate.findFirst({
      where: {
        active: true,
        isDefault: true
      }
    })

    if (globalRate) {
      const rate = await this.buildRateFromGlobal(globalRate, amount, senderCountryId, receiverCountryId)
      return { ...rate, source: 'global' }
    }

    // 4. Fallback - taux par défaut codé en dur
    return this.getDefaultRate(amount, senderCountryId, receiverCountryId)
  }

  private static async buildRateFromCorridor(corridor: any, amount: number): Promise<TransferRateCalculation | null> {
    const baseFee = corridor.baseFee ?? corridor.transferRate?.baseFee ?? 5
    const percentageFee = corridor.percentageFee ?? corridor.transferRate?.percentageFee ?? 0
    const exchangeRateMargin = corridor.exchangeRateMargin ?? corridor.transferRate?.exchangeRateMargin ?? 0
    const minAmount = corridor.minAmount ?? corridor.transferRate?.minAmount ?? 1
    const maxAmount = corridor.maxAmount ?? corridor.transferRate?.maxAmount ?? null

    const exchangeRate = await this.getExchangeRate(
      corridor.senderCountry.currencyCode,
      corridor.receiverCountry.currencyCode
    )

    return {
      baseFee: Number(baseFee),
      percentageFee: Number(percentageFee),
      totalFees: Number(baseFee) + (amount * Number(percentageFee) / 100),
      exchangeRate,
      exchangeRateMargin: Number(exchangeRateMargin),
      finalExchangeRate: exchangeRate * (1 - Number(exchangeRateMargin) / 100),
      minAmount: Number(minAmount),
      maxAmount: maxAmount ? Number(maxAmount) : null
    }
  }

  private static async buildRateFromCountryRate(countryRate: any, amount: number, senderCountryId: number, receiverCountryId: number): Promise<TransferRateCalculation | null> {
    const baseFee = countryRate.baseFee ?? countryRate.transferRate.baseFee
    const percentageFee = countryRate.percentageFee ?? countryRate.transferRate.percentageFee
    const exchangeRateMargin = countryRate.exchangeRateMargin ?? countryRate.transferRate.exchangeRateMargin
    const minAmount = countryRate.minAmount ?? countryRate.transferRate.minAmount
    const maxAmount = countryRate.maxAmount ?? countryRate.transferRate.maxAmount

    const [senderCountry, receiverCountry] = await Promise.all([
      prisma.country.findUnique({ where: { id: senderCountryId } }),
      prisma.country.findUnique({ where: { id: receiverCountryId } })
    ])

    if (!senderCountry || !receiverCountry) return null

    const exchangeRate = await this.getExchangeRate(
      senderCountry.currencyCode,
      receiverCountry.currencyCode
    )

    return {
      baseFee: Number(baseFee),
      percentageFee: Number(percentageFee),
      totalFees: Number(baseFee) + (amount * Number(percentageFee) / 100),
      exchangeRate,
      exchangeRateMargin: Number(exchangeRateMargin),
      finalExchangeRate: exchangeRate * (1 - Number(exchangeRateMargin) / 100),
      minAmount: Number(minAmount),
      maxAmount: maxAmount ? Number(maxAmount) : null
    }
  }

  private static async buildRateFromGlobal(globalRate: any, amount: number, senderCountryId: number, receiverCountryId: number): Promise<TransferRateCalculation> {
    const [senderCountry, receiverCountry] = await Promise.all([
      prisma.country.findUnique({ where: { id: senderCountryId } }),
      prisma.country.findUnique({ where: { id: receiverCountryId } })
    ])

    const exchangeRate = await this.getExchangeRate(
      senderCountry?.currencyCode || 'USD',
      receiverCountry?.currencyCode || 'USD'
    )

    return {
      baseFee: Number(globalRate.baseFee),
      percentageFee: Number(globalRate.percentageFee),
      totalFees: Number(globalRate.baseFee) + (amount * Number(globalRate.percentageFee) / 100),
      exchangeRate,
      exchangeRateMargin: Number(globalRate.exchangeRateMargin),
      finalExchangeRate: exchangeRate * (1 - Number(globalRate.exchangeRateMargin) / 100),
      minAmount: Number(globalRate.minAmount),
      maxAmount: globalRate.maxAmount ? Number(globalRate.maxAmount) : null
    }
  }

  private static getDefaultRate(amount: number, senderCountryId: number, receiverCountryId: number): TransferRateCalculation {
    return {
      baseFee: 5,
      percentageFee: 2,
      totalFees: 5 + (amount * 0.02),
      exchangeRate: 1,
      exchangeRateMargin: 0,
      finalExchangeRate: 1,
      minAmount: 1,
      maxAmount: null,
      source: 'default'
    }
  }

  /**
   * Récupère le taux de change entre deux devises
   */
  private static async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return 1

    try {
      // 1. Vérifier en base de données d'abord
      const cachedRate = await prisma.exchangeRate.findUnique({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency,
            toCurrency
          }
        }
      })

      // Si le taux est récent (moins de 1 heure), l'utiliser
      if (cachedRate && (Date.now() - cachedRate.lastUpdated.getTime()) < 3600000) {
        return Number(cachedRate.rate)
      }

      // 2. Sinon, récupérer depuis une API externe
      const rate = await this.fetchExchangeRateFromAPI(fromCurrency, toCurrency)
      
      // 3. Sauvegarder en base
      await prisma.exchangeRate.upsert({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency,
            toCurrency
          }
        },
        update: {
          rate,
          lastUpdated: new Date()
        },
        create: {
          fromCurrency,
          toCurrency,
          rate,
          source: 'api',
          lastUpdated: new Date()
        }
      })

      return rate
    } catch (error) {
      console.error('Erreur récupération taux de change:', error)
      return 1 // Fallback
    }
  }

  private static async fetchExchangeRateFromAPI(from: string, to: string): Promise<number> {
    try {
      // Utiliser l'API Fixer.io (gratuite avec limite)
      const response = await fetch(`https://api.fixer.io/latest?base=${from}&symbols=${to}`)
      const data = await response.json()
      return data.rates?.[to] || 1
    } catch (error) {
      try {
        // Fallback vers ExchangeRate-API
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`)
        const data = await response.json()
        return data.rates?.[to] || 1
      } catch (fallbackError) {
        console.error('Erreur API taux de change:', error, fallbackError)
        return 1
      }
    }
  }
}
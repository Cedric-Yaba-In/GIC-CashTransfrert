// Service pour récupérer les banques depuis des APIs externes
import { sanitizeForLog } from './security'

export class ExternalBanksAPI {
  
  // API pour les banques françaises (exemple avec une API fictive)
  static async fetchFrenchBanks(): Promise<any[]> {
    try {
      // Exemple d'API française (remplacer par une vraie API)
      const response = await fetch('https://api.banque-france.fr/banks', {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.map((bank: any) => ({
        name: bank.name,
        code: bank.bic || bank.code,
        countryCode: 'FR',
        swiftCode: bank.bic,
        website: bank.website,
        source: 'API'
      }))
    } catch (error) {
      console.error('Erreur API banques françaises:', sanitizeForLog(error))
      return []
    }
  }

  // API pour les banques américaines
  static async fetchUSBanks(): Promise<any[]> {
    try {
      // Exemple avec l'API FDIC (Federal Deposit Insurance Corporation)
      const response = await fetch('https://banks.data.fdic.gov/api/institutions?filters=ACTIVE%3A1&limit=100', {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.data?.map((bank: any) => ({
        name: bank.NAME,
        code: bank.CERT,
        countryCode: 'US',
        routingNumber: bank.ROUTING,
        website: bank.WEBADDR ? `https://${bank.WEBADDR}` : null,
        source: 'API'
      })) || []
    } catch (error) {
      console.error('Erreur API banques américaines:', sanitizeForLog(error))
      return []
    }
  }

  // API pour les banques britanniques
  static async fetchUKBanks(): Promise<any[]> {
    try {
      // Exemple avec l'API Open Banking UK
      const response = await fetch('https://api.openbanking.org.uk/open-data/v2.2/atms', {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      const uniqueBanks = new Map()
      
      data.data?.forEach((atm: any) => {
        const brandName = atm.Brand?.[0]?.BrandName
        if (brandName && !uniqueBanks.has(brandName)) {
          uniqueBanks.set(brandName, {
            name: brandName,
            code: brandName.replace(/\s+/g, '').toUpperCase(),
            countryCode: 'GB',
            source: 'API'
          })
        }
      })
      
      return Array.from(uniqueBanks.values())
    } catch (error) {
      console.error('Erreur API banques britanniques:', sanitizeForLog(error))
      return []
    }
  }

  // API générique pour d'autres pays (utilise une API de banques mondiales)
  static async fetchBanksByCountry(countryCode: string): Promise<any[]> {
    try {
      // API générique pour les banques mondiales
      const response = await fetch(`https://api.worldbank.org/v2/country/${countryCode.toLowerCase()}/indicator/FB.CBK.BRCH.P5?format=json&date=2020:2023`, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) return []
      
      // Cette API ne retourne pas directement les banques, mais on peut utiliser d'autres sources
      // Pour l'exemple, on retourne un tableau vide et on se base sur Flutterwave + données manuelles
      return []
    } catch (error) {
      console.error(`Erreur API banques pour ${countryCode}:`, sanitizeForLog(error))
      return []
    }
  }

  // Méthode principale pour récupérer les banques selon le pays
  static async fetchBanksForCountry(countryCode: string): Promise<any[]> {
    console.log(`🌐 Récupération des banques via API pour ${countryCode}`)
    
    switch (countryCode.toUpperCase()) {
      case 'FR':
        return await this.fetchFrenchBanks()
      case 'US':
        return await this.fetchUSBanks()
      case 'GB':
        return await this.fetchUKBanks()
      default:
        return await this.fetchBanksByCountry(countryCode)
    }
  }
}
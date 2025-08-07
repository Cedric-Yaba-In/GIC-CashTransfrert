import { ConfigService } from './config'

export class FlutterwaveService {
  static async getBalance(currency: string): Promise<number> {
    try {
      const config = await ConfigService.getFlutterwaveConfig()
      
      if (!config.secretKey) {
        throw new Error('Clé secrète Flutterwave manquante')
      }

      const response = await fetch('https://api.flutterwave.com/v3/balances', {
        headers: {
          'Authorization': `Bearer ${config.secretKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erreur API Flutterwave')
      }

      const data = await response.json()
      
      // Rechercher le solde pour la devise spécifiée
      const balance = data.data.find((bal: any) => bal.currency === currency)
      
      return balance ? parseFloat(balance.available_balance) : 0
    } catch (error) {
      console.error('Erreur récupération solde Flutterwave:', error)
      return 0
    }
  }
}
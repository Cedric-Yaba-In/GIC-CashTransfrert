import { ConfigService } from './config'
import { prisma } from './prisma'

interface BankData {
  name: string
  code: string
  logo?: string
  website?: string
  swiftCode?: string
  routingNumber?: string
}

interface BankWithConfig {
  id: number
  name: string
  code: string
  countryCode: string
  logo?: string
  website?: string
  swiftCode?: string
  routingNumber?: string
  source: string
  active: boolean
  configuration?: {
    id: number
    bankId: number
    accountNumber: string
    accountName: string
    iban?: string
    beneficiaryAddress?: string
    active: boolean
  } | null
}

interface SyncResult {
  total: number
  flutterwave: number
  api: number
  manual: number
  errors: string[]
}

export class BankService {
  // Récupérer les banques depuis Flutterwave pour un pays
  static async fetchFlutterwaveBanks(countryCode: string): Promise<BankData[]> {
    try {
      const config = await ConfigService.getFlutterwaveConfig()
      if (!config.secretKey) {
        console.log('Flutterwave non configuré')
        return []
      }

      const response = await fetch(`https://api.flutterwave.com/v3/banks/${countryCode}`, {
        headers: {
          'Authorization': `Bearer ${config.secretKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.log(`Flutterwave API error: ${response.status}`)
        return []
      }
      
      const data = await response.json()
      return (data.data || []).map((bank: any) => ({
        name: bank.name,
        code: bank.code,
        logo: bank.logo || null,
        website: bank.website || null,
        swiftCode: bank.swift_code || null
      }))
    } catch (error) {
      console.error('Erreur Flutterwave banks:', error)
      return []
    }
  }

  // Récupérer les banques depuis d'autres APIs (exemple: API locale)
  static async fetchOtherApiBanks(countryCode: string): Promise<BankData[]> {
    try {
      // Exemple d'intégration avec une autre API
      // Pour le Cameroun, on pourrait utiliser une API locale
      if (countryCode === 'CM') {
        // Simulation d'une API locale camerounaise
        return [
          {
            name: 'Banque Populaire du Cameroun',
            code: 'BPC',
            logo: 'https://www.bpccameroun.com/logo.png',
            website: 'https://www.bpccameroun.com',
            swiftCode: 'BPOCCMCX'
          },
          {
            name: 'Crédit Foncier du Cameroun',
            code: 'CFC',
            logo: 'https://www.creditfoncier.cm/logo.png',
            website: 'https://www.creditfoncier.cm',
            swiftCode: 'CFCMCMCX'
          }
        ]
      }
      
      // Pour d'autres pays, ajouter d'autres APIs
      return []
    } catch (error) {
      console.error('Erreur autres APIs:', error)
      return []
    }
  }

  // Récupérer les banques manuelles depuis les seeds
  static async getManualBanks(countryCode: string): Promise<BankData[]> {
    try {
      // Importer dynamiquement les seeds
      const { bankSeeds } = await import('../../prisma/bank-seeds')
      return bankSeeds
        .filter(bank => bank.countryCode === countryCode)
        .map(bank => ({
          name: bank.name,
          code: bank.code,
          logo: bank.logo,
          website: bank.website,
          swiftCode: bank.swiftCode,
          routingNumber: bank.routingNumber
        }))
    } catch (error) {
      console.error('Erreur banques manuelles:', error)
      return []
    }
  }

  // Synchronisation hybride complète
  static async syncAllBanks(countryCode: string): Promise<SyncResult> {
    const result: SyncResult = {
      total: 0,
      flutterwave: 0,
      api: 0,
      manual: 0,
      errors: []
    }

    try {
      console.log(`🔄 Synchronisation des banques pour ${countryCode}...`)

      // 1. Récupérer depuis Flutterwave
      const flutterwaveBanks = await this.fetchFlutterwaveBanks(countryCode)
      console.log(`📡 Flutterwave: ${flutterwaveBanks.length} banques trouvées`)

      // 2. Récupérer depuis des APIs externes
      const { ExternalBanksAPI } = require('./external-banks-api')
      const externalApiBanks = await ExternalBanksAPI.fetchBanksForCountry(countryCode)
      console.log(`🌐 APIs externes: ${externalApiBanks.length} banques trouvées`)
      
      // 3. Récupérer depuis d'autres APIs locales
      const otherApiBanks = await this.fetchOtherApiBanks(countryCode)
      console.log(`🏠 APIs locales: ${otherApiBanks.length} banques trouvées`)

      // 4. Récupérer les banques manuelles
      const manualBanks = await this.getManualBanks(countryCode)
      console.log(`📝 Banques manuelles: ${manualBanks.length} banques trouvées`)

      // 5. Synchroniser APIs externes
      for (const bank of externalApiBanks) {
        try {
          await prisma.bank.upsert({
            where: {
              code_countryCode: {
                code: bank.code,
                countryCode: countryCode
              }
            },
            update: {
              name: bank.name,
              logo: bank.logo,
              website: bank.website,
              swiftCode: bank.swiftCode,
              routingNumber: bank.routingNumber,
              source: 'API',
              active: true,
              updatedAt: new Date()
            },
            create: {
              name: bank.name,
              code: bank.code,
              countryCode: countryCode,
              logo: bank.logo,
              website: bank.website,
              swiftCode: bank.swiftCode,
              routingNumber: bank.routingNumber,
              source: 'API',
              active: true
            }
          })
          result.api++
        } catch (error) {
          result.errors.push(`API externe ${bank.name}: ${error}`)
        }
      }

      // 6. Synchroniser Flutterwave
      for (const bank of flutterwaveBanks) {
        try {
          await prisma.bank.upsert({
            where: {
              code_countryCode: {
                code: bank.code,
                countryCode: countryCode
              }
            },
            update: {
              name: bank.name,
              logo: bank.logo,
              website: bank.website,
              swiftCode: bank.swiftCode,
              source: 'FLUTTERWAVE',
              active: true,
              updatedAt: new Date()
            },
            create: {
              name: bank.name,
              code: bank.code,
              countryCode: countryCode,
              logo: bank.logo,
              website: bank.website,
              swiftCode: bank.swiftCode,
              source: 'FLUTTERWAVE',
              active: true
            }
          })
          result.flutterwave++
        } catch (error) {
          result.errors.push(`Flutterwave ${bank.name}: ${error}`)
        }
      }

      // 7. Synchroniser APIs locales
      for (const bank of otherApiBanks) {
        try {
          await prisma.bank.upsert({
            where: {
              code_countryCode: {
                code: bank.code,
                countryCode: countryCode
              }
            },
            update: {
              name: bank.name,
              logo: bank.logo,
              website: bank.website,
              swiftCode: bank.swiftCode,
              source: 'API',
              active: true,
              updatedAt: new Date()
            },
            create: {
              name: bank.name,
              code: bank.code,
              countryCode: countryCode,
              logo: bank.logo,
              website: bank.website,
              swiftCode: bank.swiftCode,
              source: 'API',
              active: true
            }
          })
          result.api++
        } catch (error) {
          result.errors.push(`API ${bank.name}: ${error}`)
        }
      }

      // 8. Synchroniser banques manuelles
      for (const bank of manualBanks) {
        try {
          await prisma.bank.upsert({
            where: {
              code_countryCode: {
                code: bank.code,
                countryCode: countryCode
              }
            },
            update: {
              name: bank.name,
              logo: bank.logo,
              website: bank.website,
              swiftCode: bank.swiftCode,
              routingNumber: bank.routingNumber,
              source: 'MANUAL',
              active: true,
              updatedAt: new Date()
            },
            create: {
              name: bank.name,
              code: bank.code,
              countryCode: countryCode,
              logo: bank.logo,
              website: bank.website,
              swiftCode: bank.swiftCode,
              routingNumber: bank.routingNumber,
              source: 'MANUAL',
              active: true
            }
          })
          result.manual++
        } catch (error) {
          result.errors.push(`Manuel ${bank.name}: ${error}`)
        }
      }

      result.total = result.flutterwave + result.api + result.manual
      console.log(`✅ Synchronisation terminée: ${result.total} banques`)
      
      return result
    } catch (error) {
      console.error('Erreur synchronisation globale:', error)
      result.errors.push(`Erreur globale: ${error}`)
      return result
    }
  }

  // Récupérer toutes les banques d'un pays avec synchronisation automatique
  static async getBanksByCountry(countryCode: string, forceSync = false): Promise<any[]> {
    try {
      // Vérifier si on a des banques récentes (moins de 24h)
      const recentBanks = await prisma.bank.findMany({
        where: {
          countryCode: countryCode,
          active: true,
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
          }
        }
      })

      // Si pas de banques récentes ou synchronisation forcée
      if (recentBanks.length === 0 || forceSync) {
        console.log('🔄 Synchronisation automatique des banques...')
        await this.syncAllBanks(countryCode)
      }

      // Récupérer toutes les banques
      const banks = await prisma.bank.findMany({
        where: {
          countryCode: countryCode,
          active: true
        },
        orderBy: [
          { source: 'asc' }, // FLUTTERWAVE, API, MANUAL
          { name: 'asc' }
        ]
      })

      return banks
    } catch (error) {
      console.error('Erreur getBanksByCountry:', error)
      return []
    }
  }

  // Récupérer toutes les banques d'un pays avec leurs configurations
  static async getBanksByCountryWithConfig(countryCode: string, forceSync = false): Promise<any[]> {
    try {
      // Vérifier si on a des banques récentes (moins de 24h)
      const recentBanks = await prisma.bank.findMany({
        where: {
          countryCode: countryCode,
          active: true,
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
          }
        }
      })

      // Si pas de banques récentes ou synchronisation forcée
      if (recentBanks.length === 0 || forceSync) {
        console.log('🔄 Synchronisation automatique des banques...')
        await this.syncAllBanks(countryCode)
      }

      // Récupérer toutes les banques avec leurs configurations
      const banks = await prisma.bank.findMany({
        where: {
          countryCode: countryCode,
          active: true
        },
        include: {
          configuration: true
        },
        orderBy: [
          { source: 'asc' }, // FLUTTERWAVE, API, MANUAL
          { name: 'asc' }
        ]
      })

      return banks
    } catch (error) {
      console.error('Erreur getBanksByCountryWithConfig:', error)
      return []
    }
  }

  // Ajouter une banque manuellement
  static async addBank(bankData: {
    name: string
    code: string
    countryCode: string
    logo?: string
    website?: string
    swiftCode?: string
    routingNumber?: string
  }): Promise<any> {
    return await prisma.bank.create({
      data: {
        ...bankData,
        source: 'MANUAL',
        active: true
      }
    })
  }

  // Obtenir les statistiques de synchronisation
  static async getSyncStats(countryCode: string): Promise<any> {
    const stats = await prisma.bank.groupBy({
      by: ['source'],
      where: {
        countryCode: countryCode,
        active: true
      },
      _count: {
        id: true
      }
    })

    const lastSync = await prisma.bank.findFirst({
      where: {
        countryCode: countryCode
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        updatedAt: true
      }
    })

    return {
      stats: stats.reduce((acc, stat) => {
        acc[stat.source.toLowerCase()] = stat._count.id
        return acc
      }, {} as Record<string, number>),
      lastSync: lastSync?.updatedAt,
      total: stats.reduce((sum, stat) => sum + stat._count.id, 0)
    }
  }

  // Obtenir une banque avec sa configuration
  static async getBankWithConfig(bankId: number): Promise<any> {
    return await prisma.bank.findUnique({
      where: { id: bankId },
      include: {
        configuration: true
      }
    })
  }
}
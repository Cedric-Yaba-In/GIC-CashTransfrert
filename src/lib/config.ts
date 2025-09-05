import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Secure encryption for sensitive config values
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here'
const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) return encryptedText // Return as-is if format is invalid
    
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return encryptedText // Return as-is if decryption fails
  }
}

export class ConfigService {
  private static cache = new Map<string, any>()
  private static lastFetch = 0
  private static CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static async get(key: string, defaultValue?: any): Promise<any> {
    // Check cache first
    if (this.cache.has(key) && Date.now() - this.lastFetch < this.CACHE_TTL) {
      return this.cache.get(key) ?? defaultValue
    }

    try {
      const config = await prisma.configuration.findUnique({
        where: { key }
      })

      if (!config) return defaultValue

      let value = config.value
      if (config.encrypted && value) {
        value = decrypt(value)
      }

      // Type conversion
      let convertedValue: any = value
      if (config.type === 'NUMBER' && value) {
        convertedValue = parseFloat(value)
      } else if (config.type === 'BOOLEAN' && value) {
        convertedValue = value.toLowerCase() === 'true'
      } else if (config.type === 'JSON' && value) {
        try {
          convertedValue = JSON.parse(value)
        } catch {
          convertedValue = defaultValue
        }
      }
      value = convertedValue

      this.cache.set(key, value)
      return value ?? defaultValue
    } catch (error) {
      console.error(`Config error for key ${key}:`, error)
      return defaultValue
    }
  }

  static async set(key: string, value: any): Promise<void> {
    try {
      const config = await prisma.configuration.findUnique({
        where: { key }
      })

      if (!config) {
        throw new Error(`Configuration key ${key} not found`)
      }

      let stringValue = String(value)
      if (config.type === 'JSON') {
        stringValue = JSON.stringify(value)
      }

      if (config.encrypted) {
        stringValue = encrypt(stringValue)
      }

      await prisma.configuration.update({
        where: { key },
        data: { value: stringValue }
      })

      // Update cache
      this.cache.set(key, value)
    } catch (error) {
      console.error(`Config set error for key ${key}:`, error)
      throw error
    }
  }

  static async getAll(): Promise<any[]> {
    try {
      const configs = await prisma.configuration.findMany({
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      })

      return configs.map(config => {
        let value = config.value
        // Pour l'affichage dans l'UI, on déchiffre les valeurs pour permettre l'édition
        if (config.encrypted && value && value !== '') {
          try {
            value = decrypt(value)
          } catch {
            // Si le déchiffrement échoue, on garde la valeur originale
            value = config.value
          }
        }

        return {
          ...config,
          value: value || ''
        }
      })
    } catch (error) {
      console.error('Config getAll error:', error)
      return []
    }
  }

  static async updateMultiple(updates: { key: string; value: any }[]): Promise<void> {
    try {
      for (const update of updates) {
        await this.set(update.key, update.value)
      }
      this.clearCache()
    } catch (error) {
      console.error('Config updateMultiple error:', error)
      throw error
    }
  }

  static clearCache(): void {
    this.cache.clear()
    this.lastFetch = 0
  }

  // Helper methods for common configs
  static async getAppName(): Promise<string> {
    return this.get('APP_NAME', 'GIC CashTransfer')
  }

  static async getAppUrl(): Promise<string> {
    return this.get('APP_URL', 'http://localhost:3000')
  }

  static async getEmailConfig(): Promise<any> {
    return {
      host: await this.get('EMAIL_HOST'),
      port: await this.get('EMAIL_PORT', 587),
      user: await this.get('EMAIL_USER'),
      pass: await this.get('EMAIL_PASS'),
      from: await this.get('EMAIL_FROM')
    }
  }

  static async getTwilioConfig(): Promise<any> {
    return {
      accountSid: await this.get('TWILIO_ACCOUNT_SID'),
      authToken: await this.get('TWILIO_AUTH_TOKEN'),
      phoneNumber: await this.get('TWILIO_PHONE_NUMBER')
    }
  }



  static async getCinetPayConfig(): Promise<any> {
    return {
      apiKey: await this.get('CINETPAY_API_KEY'),
      siteId: await this.get('CINETPAY_SITE_ID'),
      secretKey: await this.get('CINETPAY_SECRET_KEY'),
      apiPassword: await this.get('CINETPAY_API_PASSWORD'),
      notifyUrl: await this.get('CINETPAY_NOTIFY_URL')
    }
  }
}
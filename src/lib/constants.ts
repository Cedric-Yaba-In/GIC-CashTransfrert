// Constantes pour les méthodes de paiement
export const PAYMENT_METHODS = {
  CINETPAY: {
    CARD: 'CARD',
    ORANGE_MONEY_CI: 'ORANGE_MONEY_CI',
    MOOV_CI: 'MOOV_CI',
    MTN_CI: 'MTN_CI',
    WAVE_CI: 'WAVE_CI',
    MTN_GH: 'MTN_GH',
    VODAFONE_GH: 'VODAFONE_GH',
    AIRTELTIGO_GH: 'AIRTELTIGO_GH',
    PAYPAL: 'PAYPAL'
  },
  FLUTTERWAVE: {
    CARD: 'card',
    BANK_TRANSFER: 'banktransfer',
    USSD: 'ussd',
    MOBILE_MONEY: 'mobilemoney'
  }
} as const

// Devises supportées
export const SUPPORTED_CURRENCIES = {
  XOF: 'XOF', // West Africa CFA
  XAF: 'XAF', // Central Africa CFA
  GHS: 'GHS', // Ghana
  KES: 'KES', // Kenya
  UGX: 'UGX', // Uganda
  TZS: 'TZS', // Tanzania
  RWF: 'RWF', // Rwanda
  NGN: 'NGN', // Nigeria
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP'
} as const

// Configuration des méthodes par devise
export const CURRENCY_PAYMENT_METHODS = {
  [SUPPORTED_CURRENCIES.XOF]: [
    PAYMENT_METHODS.CINETPAY.ORANGE_MONEY_CI,
    PAYMENT_METHODS.CINETPAY.MOOV_CI,
    PAYMENT_METHODS.CINETPAY.MTN_CI,
    PAYMENT_METHODS.CINETPAY.WAVE_CI
  ],
  [SUPPORTED_CURRENCIES.XAF]: [
    PAYMENT_METHODS.CINETPAY.ORANGE_MONEY_CI,
    PAYMENT_METHODS.CINETPAY.MOOV_CI,
    PAYMENT_METHODS.CINETPAY.MTN_CI,
    PAYMENT_METHODS.CINETPAY.WAVE_CI
  ],
  [SUPPORTED_CURRENCIES.GHS]: [
    PAYMENT_METHODS.CINETPAY.MTN_GH,
    PAYMENT_METHODS.CINETPAY.VODAFONE_GH,
    PAYMENT_METHODS.CINETPAY.AIRTELTIGO_GH
  ]
} as const

// Langues supportées
export const SUPPORTED_LANGUAGES = {
  FR: 'fr',
  EN: 'en'
} as const

// Statuts de transaction
export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
} as const

// Configuration par défaut
export const DEFAULT_CONFIG = {
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_TRANSACTION_AMOUNT: 50000,
  MIN_TRANSACTION_AMOUNT: 1,
  DEFAULT_LANGUAGE: SUPPORTED_LANGUAGES.FR
} as const
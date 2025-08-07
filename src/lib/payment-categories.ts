// Configuration des catégories de méthodes de paiement
export const PAYMENT_CATEGORIES = {
  HYBRID: {
    id: 'HYBRID',
    name: 'Hybride',
    description: 'Méthodes de paiement hybrides et API',
    icon: 'Globe',
    color: 'orange',
    subTypes: {
      FLUTTERWAVE: {
        id: 'FLUTTERWAVE',
        name: 'Flutterwave',
        type: 'FLUTTERWAVE',
        description: 'API Flutterwave pour paiements automatiques'
      }
    }
  },
  BANK_TRANSFER: {
    id: 'BANK_TRANSFER',
    name: 'Transfert Bancaire',
    description: 'Virements bancaires directs',
    icon: 'Building2',
    color: 'blue',
    subTypes: {
      BANK: {
        id: 'BANK',
        name: 'Banque',
        type: 'BANK_TRANSFER',
        description: 'Virement vers compte bancaire'
      }
    }
  },
  MOBILE_MONEY: {
    id: 'MOBILE_MONEY',
    name: 'Mobile Money',
    description: 'Paiements mobiles',
    icon: 'Smartphone',
    color: 'green',
    subTypes: {
      ORANGE: {
        id: 'ORANGE',
        name: 'Orange Money',
        type: 'MOBILE_MONEY',
        description: 'Paiement via Orange Money (non intégré)'
      },
      MTN: {
        id: 'MTN',
        name: 'MTN Mobile Money',
        type: 'MOBILE_MONEY',
        description: 'Paiement via MTN Mobile Money (non intégré)'
      }
    }
  }
} as const

export type PaymentCategoryId = keyof typeof PAYMENT_CATEGORIES
export type PaymentSubTypeId = string

// Fonction pour obtenir les catégories disponibles pour un pays
export function getAvailableCategoriesForCountry(paymentMethods: any[]): PaymentCategoryId[] {
  const categories = new Set<PaymentCategoryId>()
  
  paymentMethods.forEach(method => {
    if (method.category) {
      categories.add(method.category as PaymentCategoryId)
    }
  })
  
  return Array.from(categories)
}

// Fonction pour vérifier si une catégorie a des sous-types configurés
export function hasCategorySubTypes(categoryId: PaymentCategoryId, paymentMethods: any[]): boolean {
  return paymentMethods.some(method => 
    method.category === categoryId && method.active
  )
}

// Fonction pour obtenir les méthodes par catégorie
export function getMethodsByCategory(categoryId: PaymentCategoryId, paymentMethods: any[]): any[] {
  return paymentMethods.filter(method => method.category === categoryId)
}
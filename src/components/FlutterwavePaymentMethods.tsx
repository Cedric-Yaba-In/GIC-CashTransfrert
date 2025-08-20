'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Building, Loader } from 'lucide-react'

interface FlutterwavePaymentMethod {
  method: string
  currency: string
  amount_charged_fee: number
}

interface FlutterwavePaymentMethodsProps {
  currency: string
  onMethodSelect?: (method: FlutterwavePaymentMethod) => void
}

export default function FlutterwavePaymentMethods({ 
  currency, 
  onMethodSelect 
}: FlutterwavePaymentMethodsProps) {
  const [methods, setMethods] = useState<FlutterwavePaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentMethods()
  }, [currency])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/flutterwave/payment-methods?currency=${currency}`)
      const data = await response.json()
      
      if (response.ok) {
        setMethods(data.data || [])
      } else {
        setError('Impossible de charger les méthodes de paiement')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
        return <CreditCard className="h-6 w-6" />
      case 'mobilemoney':
      case 'mobile_money':
        return <Smartphone className="h-6 w-6" />
      case 'banktransfer':
      case 'bank_transfer':
        return <Building className="h-6 w-6" />
      default:
        return <CreditCard className="h-6 w-6" />
    }
  }

  const getMethodName = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
        return 'Carte bancaire'
      case 'mobilemoney':
      case 'mobile_money':
        return 'Mobile Money'
      case 'banktransfer':
      case 'bank_transfer':
        return 'Virement bancaire'
      case 'ussd':
        return 'USSD'
      default:
        return method
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Chargement des méthodes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchPaymentMethods}
          className="mt-2 text-red-600 hover:text-red-800 font-medium text-sm underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">Aucune méthode de paiement disponible pour {currency}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 mb-4">
        Méthodes de paiement disponibles ({currency})
      </h3>
      
      <div className="grid gap-3">
        {methods.map((method, index) => (
          <div
            key={`${method.method}-${index}`}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
            onClick={() => onMethodSelect?.(method)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  {getMethodIcon(method.method)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {getMethodName(method.method)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Devise: {method.currency}
                  </p>
                </div>
              </div>
              
              {method.amount_charged_fee > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Frais</p>
                  <p className="font-medium text-gray-900">
                    {method.amount_charged_fee} {method.currency}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Les méthodes disponibles dépendent de votre pays et de la devise sélectionnée.
        </p>
      </div>
    </div>
  )
}
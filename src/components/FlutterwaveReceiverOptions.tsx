'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Building, Loader } from 'lucide-react'

interface FlutterwaveReceiverOptionsProps {
  countryCode: string
  currency: string
  onOptionsLoad?: (options: any[]) => void
}

export default function FlutterwaveReceiverOptions({ 
  countryCode, 
  currency, 
  onOptionsLoad 
}: FlutterwaveReceiverOptionsProps) {
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReceiverOptions()
  }, [countryCode, currency])

  const fetchReceiverOptions = async () => {
    try {
      setLoading(true)
      
      console.log('Fetching Flutterwave options for currency:', currency)
      const response = await fetch(`/api/flutterwave/payment-methods?currency=${currency}`)
      const data = await response.json()
      
      console.log('Flutterwave API response:', data)
      
      if (response.ok) {
        if (data.status === 'success' && data.data && Array.isArray(data.data)) {
          const receiverOptions = data.data.filter((method: any) => 
            ['mobilemoney', 'banktransfer', 'account'].includes(method.method?.toLowerCase() || '')
          )
          
          console.log('Filtered receiver options:', receiverOptions)
          setOptions(receiverOptions)
          onOptionsLoad?.(receiverOptions)
        } else {
          console.log('No data in response or invalid format')
          setOptions([])
          onOptionsLoad?.([])
        }
      } else {
        console.error('API error:', data)
        setOptions([])
      }
    } catch (error) {
      console.error('Erreur chargement options Flutterwave:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'mobilemoney':
      case 'mobile_money':
        return <Smartphone className="h-5 w-5" />
      case 'banktransfer':
      case 'bank_transfer':
        return <Building className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const getMethodName = (method: string) => {
    switch (method.toLowerCase()) {
      case 'mobilemoney':
      case 'mobile_money':
        return 'Mobile Money'
      case 'banktransfer':
      case 'bank_transfer':
        return 'Virement bancaire'
      case 'account':
        return 'Compte Flutterwave'
      default:
        return method
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Chargement des options...</span>
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">Aucune option de réception Flutterwave disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-blue-900 mb-3">Options de réception disponibles :</h4>
      
      <div className="grid gap-2">
        {options.map((option, index) => (
          <div
            key={`${option.method}-${index}`}
            className="flex items-center space-x-3 bg-white border border-blue-200 rounded-lg p-3"
          >
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              {getMethodIcon(option.method)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {getMethodName(option.method)}
              </p>
              <p className="text-sm text-gray-600">
                Devise: {option.currency}
              </p>
            </div>
            {option.amount_charged_fee > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Frais</p>
                <p className="text-sm font-medium text-gray-700">
                  {option.amount_charged_fee} {option.currency}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Vous choisissez maintenant comment le destinataire recevra l'argent. Après validation par l'administrateur, le transfert sera effectué automatiquement.
        </p>
      </div>
    </div>
  )
}
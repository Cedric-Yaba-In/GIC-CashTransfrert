'use client'

import { CreditCard, CheckCircle, AlertCircle, Building2, Smartphone, Globe } from 'lucide-react'

interface PaymentMethodCardProps {
  method: {
    paymentMethodId: string
    paymentMethodName: string
    paymentMethodType: string
    available: boolean
    balance: number
    minAmount: number
    maxAmount: number | null
  }
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
  currency?: string
}

export default function PaymentMethodCard({ 
  method, 
  isSelected, 
  onSelect, 
  disabled = false,
  currency = 'EUR'
}: PaymentMethodCardProps) {
  const getIcon = () => {
    switch (method.paymentMethodType) {
      case 'BANK_TRANSFER':
        return Building2
      case 'MOBILE_MONEY':
        return Smartphone
      case 'FLUTTERWAVE':
        return Globe
      default:
        return CreditCard
    }
  }

  const getTypeColor = () => {
    switch (method.paymentMethodType) {
      case 'BANK_TRANSFER':
        return 'text-blue-600 bg-blue-50'
      case 'MOBILE_MONEY':
        return 'text-green-600 bg-green-50'
      case 'FLUTTERWAVE':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const Icon = getIcon()

  return (
    <label 
      className={`group relative flex flex-col sm:flex-row sm:items-center p-4 sm:p-6 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${
        disabled || !method.available
          ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' 
          : isSelected
            ? 'border-primary-500 bg-primary-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
      }`}
    >
      <input
        type="radio"
        checked={isSelected}
        onChange={onSelect}
        disabled={disabled || !method.available}
        className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 border-gray-300 focus:ring-primary-500 mb-3 sm:mb-0 sm:mr-4 self-start sm:self-center"
      />
      
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-3">
          <div className="flex items-center space-x-3 mb-2 sm:mb-0">
            <div className={`p-2 rounded-lg ${getTypeColor()}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{method.paymentMethodName}</h4>
              <p className="text-xs sm:text-sm text-gray-500 capitalize">{method.paymentMethodType.replace('_', ' ')}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {method.available ? (
              <div className="flex items-center px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Disponible</span>
                <span className="sm:hidden">OK</span>
              </div>
            ) : (
              <div className="flex items-center px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-medium">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Indisponible</span>
                <span className="sm:hidden">KO</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <p className="text-gray-500 font-medium mb-1 text-xs sm:text-sm">Limites</p>
            <p className="font-semibold text-gray-900 text-xs sm:text-sm">
              {method.minAmount} - {method.maxAmount || '∞'} {currency}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <p className="text-gray-500 font-medium mb-1 text-xs sm:text-sm">Solde disponible</p>
            <p className={`font-semibold text-xs sm:text-sm ${method.available ? 'text-green-600' : 'text-red-600'}`}>
              {method.balance.toFixed(2)} {currency}
            </p>
          </div>
        </div>
        
        {!method.available && method.balance < method.minAmount && (
          <div className="mt-3 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-xs sm:text-sm">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
              Solde insuffisant pour ce montant
            </p>
          </div>
        )}
      </div>
    </label>
  )
}
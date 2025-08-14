'use client'

import { useState, useEffect } from 'react'
import { Calculator, ArrowRight } from 'lucide-react'

interface FeeCalculatorPreviewProps {
  modalType: 'global' | 'country' | 'corridor'
  baseFee?: number
  percentageFee?: number
  exchangeRateMargin?: number
  countryId?: string
  senderCountryId?: string
  receiverCountryId?: string
  countries: Array<{ id: number; name: string; currencyCode: string; flag: string }>
}

export default function FeeCalculatorPreview({
  modalType,
  baseFee,
  percentageFee,
  exchangeRateMargin,
  countryId,
  senderCountryId,
  receiverCountryId,
  countries
}: FeeCalculatorPreviewProps) {
  const [exchangeRate, setExchangeRate] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  
  const testAmount = 1000
  
  // Déterminer les devises selon le type
  let baseCurrency = 'USD'
  let targetCurrency = 'USD'
  
  if (modalType === 'country' && countryId) {
    const country = countries.find(c => c.id === parseInt(countryId))
    baseCurrency = country?.currencyCode || 'USD'
    targetCurrency = country?.currencyCode || 'USD'
  } else if (modalType === 'corridor' && senderCountryId && receiverCountryId) {
    const senderCountry = countries.find(c => c.id === parseInt(senderCountryId))
    const receiverCountry = countries.find(c => c.id === parseInt(receiverCountryId))
    baseCurrency = senderCountry?.currencyCode || 'USD'
    targetCurrency = receiverCountry?.currencyCode || 'USD'
  }

  useEffect(() => {
    if (baseCurrency !== targetCurrency) {
      const fetchRate = async () => {
        setLoading(true)
        try {
          const response = await fetch(`/api/exchange-rates?from=${baseCurrency}&to=${targetCurrency}`)
          const data = await response.json()
          if (data.rate) {
            setExchangeRate(data.rate)
          }
        } catch (error) {
          console.error('Erreur taux:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchRate()
    }
  }, [baseCurrency, targetCurrency])

  if (!baseFee && !percentageFee) {
    return null
  }

  const calculatedBaseFee = baseFee || 0
  const calculatedPercentageFee = (testAmount * (percentageFee || 0)) / 100
  const totalFees = calculatedBaseFee + calculatedPercentageFee
  
  // Calcul correct des frais et conversion
  const amountAfterFees = testAmount - totalFees
  const marginRate = exchangeRate * (1 - (exchangeRateMargin || 0) / 100)
  const convertedAmount = amountAfterFees * marginRate
  const exchangeMargin = amountAfterFees * (exchangeRate - marginRate)

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-center space-x-2 mb-3">
        <Calculator className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-900">Exemple de calcul</span>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-purple-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Montant envoyé:</span>
            <span className="font-medium">{testAmount} {baseCurrency}</span>
          </div>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Frais de base:</span>
            <span className="text-red-600">-{calculatedBaseFee.toFixed(2)} {baseCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Commission ({percentageFee || 0}%):</span>
            <span className="text-red-600">-{calculatedPercentageFee.toFixed(2)} {baseCurrency}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-medium text-gray-800">Total frais:</span>
            <span className="font-medium text-red-600">-{totalFees.toFixed(2)} {baseCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-800">Montant à convertir:</span>
            <span className="font-medium">{amountAfterFees.toFixed(2)} {baseCurrency}</span>
          </div>
        </div>
        
        {baseCurrency !== targetCurrency && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Conversion:</span>
              <div className="flex items-center space-x-1">
                <span>{baseCurrency}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{targetCurrency}</span>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Taux marché:</span>
                <span>{loading ? '...' : exchangeRate.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avec marge ({exchangeRateMargin || 0}%):</span>
                <span>{loading ? '...' : marginRate.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Marge sur change:</span>
                <span>+{loading ? '...' : exchangeMargin.toFixed(2)} {baseCurrency}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-purple-100 rounded-lg p-3">
          <div className="flex justify-between text-sm font-medium text-purple-900">
            <span>Destinataire reçoit:</span>
            <span>{loading ? '...' : convertedAmount.toFixed(2)} {targetCurrency}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
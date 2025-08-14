'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, Clock } from 'lucide-react'

interface ExchangeRateDisplayProps {
  fromCurrency: string
  toCurrency: string
  amount?: number
  showRefresh?: boolean
  className?: string
}

export default function ExchangeRateDisplay({
  fromCurrency,
  toCurrency,
  amount = 1,
  showRefresh = true,
  className = ''
}: ExchangeRateDisplayProps) {
  const [rate, setRate] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchRate = async () => {
    if (fromCurrency === toCurrency) {
      setRate(1)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/exchange-rates?from=${fromCurrency}&to=${toCurrency}`)
      const data = await response.json()
      
      if (data.rate) {
        setRate(data.rate)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Erreur récupération taux:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRate()
  }, [fromCurrency, toCurrency])

  const convertedAmount = amount * rate

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Taux de change</span>
        </div>
        {showRefresh && (
          <button
            onClick={fetchRate}
            disabled={loading}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            1 {fromCurrency} =
          </span>
          <span className="font-semibold text-gray-900">
            {loading ? '...' : `${rate.toFixed(4)} ${toCurrency}`}
          </span>
        </div>
        
        {amount !== 1 && (
          <div className="flex items-center justify-between border-t border-blue-200 pt-2">
            <span className="text-sm text-gray-600">
              {amount} {fromCurrency} =
            </span>
            <span className="font-bold text-blue-900">
              {loading ? '...' : `${convertedAmount.toFixed(2)} ${toCurrency}`}
            </span>
          </div>
        )}
        
        {lastUpdate && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Mis à jour: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
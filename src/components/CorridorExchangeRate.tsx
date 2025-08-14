'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, Clock } from 'lucide-react'

interface CorridorExchangeRateProps {
  senderCountryId: string
  receiverCountryId: string
  countries: Array<{ id: number; name: string; currencyCode: string; flag: string }>
  className?: string
}

export default function CorridorExchangeRate({
  senderCountryId,
  receiverCountryId,
  countries,
  className = ''
}: CorridorExchangeRateProps) {
  const [rate, setRate] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const senderCountry = countries.find(c => c.id === parseInt(senderCountryId))
  const receiverCountry = countries.find(c => c.id === parseInt(receiverCountryId))

  const fetchRate = async () => {
    if (!senderCountry || !receiverCountry || senderCountry.currencyCode === receiverCountry.currencyCode) {
      setRate(1)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/exchange-rates?from=${senderCountry.currencyCode}&to=${receiverCountry.currencyCode}`)
      const data = await response.json()
      
      if (data.rate) {
        setRate(data.rate)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Erreur récupération taux:', error)
      setRate(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (senderCountryId && receiverCountryId && senderCountry && receiverCountry) {
      fetchRate()
    }
  }, [senderCountryId, receiverCountryId, senderCountry, receiverCountry])

  if (!senderCountry || !receiverCountry) {
    return (
      <div className={`bg-gray-50 rounded-xl p-4 border border-gray-200 ${className}`}>
        <p className="text-sm text-gray-500 text-center">Sélectionnez les deux pays pour voir le taux de change</p>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">Taux de change actuel</span>
        </div>
        <button
          onClick={fetchRate}
          disabled={loading}
          className="p-1 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={senderCountry.flag} alt="" className="w-5 h-4 rounded" />
            <span className="text-sm font-medium">{senderCountry.currencyCode}</span>
          </div>
          <span className="text-xs text-gray-500">vers</span>
          <div className="flex items-center space-x-2">
            <img src={receiverCountry.flag} alt="" className="w-5 h-4 rounded" />
            <span className="text-sm font-medium">{receiverCountry.currencyCode}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-green-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              1 {senderCountry.currencyCode} =
            </span>
            <span className="font-bold text-green-900">
              {loading ? '...' : `${rate.toFixed(4)} ${receiverCountry.currencyCode}`}
            </span>
          </div>
        </div>
        
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
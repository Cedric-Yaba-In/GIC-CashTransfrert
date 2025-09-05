'use client'

import { useState } from 'react'
import { RefreshCw, ChevronDown, ChevronUp, DollarSign, Eye, EyeOff } from 'lucide-react'

interface FlutterwaveBalanceCardProps {
  countryId: number
  countryName: string
  totalBalance: number
  balanceDetails?: any[]
  onSync: () => void
  loading?: boolean
}

export default function FlutterwaveBalanceCard({
  countryId,
  countryName,
  totalBalance,
  balanceDetails = [],
  onSync,
  loading = false
}: FlutterwaveBalanceCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch(`/api/admin/wallets/sync-flutterwave/${countryId}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        onSync()
      }
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Flutterwave</h3>
              <p className="text-sm text-gray-600">{countryName}</p>
            </div>
          </div>
          
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
            title="Synchroniser les soldes"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Solde total</span>
            <span className="text-lg font-bold text-gray-900">
              {totalBalance.toFixed(2)} USD
            </span>
          </div>

          {balanceDetails.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                Détails par devise ({balanceDetails.length})
              </span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}

          {showDetails && balanceDetails.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {balanceDetails.map((balance, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      {balance.currency}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {balance.availableBalance.toFixed(2)}
                    </div>
                    {balance.ledgerBalance !== balance.availableBalance && (
                      <div className="text-xs text-gray-500">
                        Ledger: {balance.ledgerBalance.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {balanceDetails.length === 0 && !loading && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Aucun détail de solde disponible
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Chargement...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
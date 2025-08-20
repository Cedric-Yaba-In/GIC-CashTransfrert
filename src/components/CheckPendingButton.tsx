'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function CheckPendingButton({ onRefresh }: { onRefresh?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const checkPendingTransactions = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/admin/check-pending', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ Vérifié ${data.checkedCount} transactions, ${data.updatedCount} mises à jour`)
        if (onRefresh) {
          setTimeout(onRefresh, 1000) // Rafraîchir après 1 seconde
        }
      } else {
        setResult(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      setResult('❌ Erreur de connexion')
    } finally {
      setLoading(false)
      // Effacer le message après 5 secondes
      setTimeout(() => setResult(''), 5000)
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={checkPendingTransactions}
        disabled={loading}
        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Vérification...' : 'Vérifier les paiements'}
      </button>
      
      {result && (
        <span className="text-sm font-medium">
          {result}
        </span>
      )}
    </div>
  )
}
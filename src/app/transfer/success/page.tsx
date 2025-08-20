'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Copy, Loader } from 'lucide-react'

export default function TransferSuccessPage() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const [copied, setCopied] = useState(false)
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ref) {
      fetchTransactionStatus()
    } else {
      setLoading(false)
    }
  }, [ref])

  const fetchTransactionStatus = async () => {
    try {
      const response = await fetch(`/api/transactions/track?reference=${ref}`)
      if (response.ok) {
        const data = await response.json()
        setTransaction(data)
        // Vérifier que la transaction est bien payée
        if (data.status !== 'PAID' && data.status !== 'COMPLETED') {
          console.warn('Transaction not in paid status:', data.status)
        }
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReference = () => {
    if (ref) {
      navigator.clipboard.writeText(ref)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification du statut de la transaction...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement réussi !
        </h1>
        
        <p className="text-gray-600 mb-6">
          {(transaction as any)?.status === 'PAID' ? 
            'Votre paiement a été traité avec succès. Notre équipe va maintenant traiter le transfert vers le destinataire.' :
            (transaction as any)?.status === 'COMPLETED' ?
            'Votre transfert a été complété avec succès. Le destinataire a reçu les fonds.' :
            'Votre paiement a été traité avec succès. Votre transfert est en cours de traitement.'
          }
        </p>

        {ref && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Référence de transaction :</p>
            <div className="flex items-center justify-between bg-white rounded-xl p-3 border">
              <span className="font-mono text-sm text-gray-900">{ref}</span>
              <button
                onClick={copyReference}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copier la référence"
              >
                <Copy className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-2">Référence copiée !</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-2xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Prochaines étapes</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              {(transaction as any)?.status === 'PAID' ? (
                <>
                  <li>• Votre paiement a été confirmé</li>
                  <li>• Notre équipe va traiter le transfert vers le destinataire</li>
                  <li>• Vous recevrez une notification une fois le transfert effectué</li>
                </>
              ) : (transaction as any)?.status === 'COMPLETED' ? (
                <>
                  <li>• ✓ Paiement confirmé</li>
                  <li>• ✓ Transfert effectué</li>
                  <li>• ✓ Destinataire notifié</li>
                </>
              ) : (
                <>
                  <li>• Votre transaction sera vérifiée par notre équipe</li>
                  <li>• Le destinataire recevra les fonds sous 24h</li>
                  <li>• Vous recevrez une confirmation par email</li>
                </>
              )}
            </ul>
          </div>

          <Link
            href="/track"
            className="w-full bg-gradient-to-r from-[#0B3371] to-[#1e4a7a] text-white py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
          >
            <span>Suivre ma transaction</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/"
            className="block w-full text-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
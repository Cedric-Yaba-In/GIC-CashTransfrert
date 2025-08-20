'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { XCircle, ArrowLeft, RefreshCw, Loader } from 'lucide-react'

export default function TransferFailedPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const ref = searchParams.get('ref')
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
      console.log('Fetching transaction status for ref:', ref)
      const response = await fetch(`/api/transactions/track?reference=${ref}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Transaction found:', data)
        setTransaction(data)
      } else {
        console.log('Transaction not found, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (transactionStatus: string | null, reason: string | null) => {
    // Priorité au statut réel de la transaction
    if (transactionStatus === 'CANCELLED') {
      return {
        title: 'Transaction annulée',
        message: 'Vous avez annulé le paiement. Aucun montant n\'a été débité de votre compte.',
        icon: '🚫',
        color: 'gray'
      }
    }
    
    if (transactionStatus === 'FAILED') {
      return {
        title: 'Paiement échoué',
        message: 'Le paiement n\'a pas pu être traité. Veuillez vérifier vos informations de paiement et réessayer.',
        icon: '❌',
        color: 'red'
      }
    }

    // Fallback sur le paramètre reason si pas de statut de transaction
    switch (reason) {
      case 'cancelled':
        return {
          title: 'Paiement annulé',
          message: 'Vous avez annulé le paiement. Aucun montant n\'a été débité de votre compte.',
          icon: '🚫',
          color: 'gray'
        }
      case 'failed':
        return {
          title: 'Paiement échoué',
          message: 'Le paiement n\'a pas pu être traité. Veuillez vérifier vos informations de paiement et réessayer.',
          icon: '❌',
          color: 'red'
        }
      case 'verification_failed':
        return {
          title: 'Vérification échouée',
          message: 'La vérification du paiement a échoué. Veuillez contacter notre support si le montant a été débité.',
          icon: '⚠️',
          color: 'orange'
        }
      case 'callback_error':
        return {
          title: 'Erreur technique',
          message: 'Une erreur technique s\'est produite lors du traitement. Veuillez contacter notre support.',
          icon: '🔧',
          color: 'red'
        }
      case 'error':
        return {
          title: 'Erreur de paiement',
          message: 'Une erreur s\'est produite lors du traitement du paiement. Veuillez réessayer.',
          icon: '⚠️',
          color: 'red'
        }
      case 'unknown':
        return {
          title: 'Statut inconnu',
          message: 'Le statut du paiement n\'a pas pu être déterminé. Veuillez contacter notre support.',
          icon: '❓',
          color: 'orange'
        }
      case 'transaction_not_found':
        return {
          title: 'Transaction introuvable',
          message: 'La transaction n\'a pas été trouvée dans notre système. Veuillez contacter notre support.',
          icon: '🔍',
          color: 'orange'
        }
      default:
        return {
          title: 'Paiement non abouti',
          message: 'Le paiement n\'a pas pu être finalisé. Veuillez réessayer ou contacter notre support.',
          icon: '❌',
          color: 'red'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <Loader className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification du statut de la transaction...</p>
        </div>
      </div>
    )
  }

  const errorInfo = getErrorMessage(transaction?.status, reason)
  const colorClasses = {
    red: 'from-red-50 to-red-100 text-red-600 bg-red-100',
    orange: 'from-orange-50 to-orange-100 text-orange-600 bg-orange-100',
    gray: 'from-gray-50 to-gray-100 text-gray-600 bg-gray-100'
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colorClasses[errorInfo.color]} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className={`w-20 h-20 ${colorClasses[errorInfo.color]} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <span className="text-3xl">{errorInfo.icon}</span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {errorInfo.title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {errorInfo.message}
        </p>

        {ref && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Référence de transaction :</p>
            <div className="bg-white rounded-xl p-3 border">
              <span className="font-mono text-sm text-gray-900">{ref}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {(transaction?.status === 'CANCELLED' || reason === 'cancelled') ? (
            <Link
              href="/transfer"
              className="w-full bg-gradient-to-r from-[#0B3371] to-[#1e4a7a] text-white py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Recommencer le transfert</span>
            </Link>
          ) : (
            <>
              <Link
                href="/transfer"
                className="w-full bg-gradient-to-r from-[#0B3371] to-[#1e4a7a] text-white py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Réessayer</span>
              </Link>
              
              <Link
                href="/support"
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Contacter le support
              </Link>
            </>
          )}

          <Link
            href="/"
            className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        {(reason === 'verification_failed' || reason === 'callback_error') && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important :</strong> Si un montant a été débité de votre compte, 
              veuillez conserver cette référence et contacter notre support immédiatement.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
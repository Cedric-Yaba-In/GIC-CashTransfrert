'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Home } from 'lucide-react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [txRef, setTxRef] = useState('')
  const [transactionId, setTransactionId] = useState('')

  useEffect(() => {
    setTxRef(searchParams.get('tx_ref') || '')
    setTransactionId(searchParams.get('transaction_id') || '')
    
    // Vérifier et mettre à jour les wallets
    if (searchParams.get('transaction_id')) {
      verifyPayment(searchParams.get('transaction_id')!)
    }
  }, [searchParams])

  const verifyPayment = async (transactionId: string) => {
    try {
      await fetch('/api/flutterwave/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: transactionId, tx_ref: txRef })
      })
    } catch (error) {
      console.error('Error verifying payment:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-green-100 p-8 text-center">
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Paiement réussi !</h1>
        <p className="text-gray-600 mb-6">
          Votre dépôt a été traité avec succès. Les fonds ont été ajoutés à votre wallet.
        </p>
        
        {txRef && (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700">Référence de transaction</p>
            <p className="font-mono text-sm text-green-800">{txRef}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <Link
            href="/transfer"
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center"
          >
            Faire un transfert
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
          
          <Link
            href="/"
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
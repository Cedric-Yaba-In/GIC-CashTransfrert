'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function PaymentErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [txRef, setTxRef] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    setTxRef(searchParams.get('tx_ref') || '')
    setReason(searchParams.get('reason') || 'unknown')
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
        <div className="bg-gradient-to-r from-red-100 to-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Paiement échoué</h1>
        <p className="text-gray-600 mb-6">
          Votre paiement n'a pas pu être traité. Veuillez réessayer ou utiliser une autre méthode de paiement.
        </p>
        
        {txRef && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Référence de transaction</p>
            <p className="font-mono text-sm text-gray-800">{txRef}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => router.push('/transfer/payment')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer le paiement
          </button>
          
          <Link
            href="/transfer"
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au transfert
          </Link>
        </div>
      </div>
    </div>
  )
}
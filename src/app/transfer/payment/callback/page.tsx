'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PaymentCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const processCallback = async () => {
      const status = searchParams.get('status')
      const tx_ref = searchParams.get('tx_ref')
      const transaction_id = searchParams.get('transaction_id')
      
      console.log('Processing callback:', { status, tx_ref, transaction_id })
      
      // Rediriger vers l'API de callback pour traitement
      const callbackUrl = `/api/flutterwave/callback?status=${status}&tx_ref=${tx_ref}&transaction_id=${transaction_id || ''}`
      window.location.href = callbackUrl
    }
    
    processCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3371] mx-auto mb-4"></div>
        <p className="text-gray-600">Traitement du paiement...</p>
      </div>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3371] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  )
}
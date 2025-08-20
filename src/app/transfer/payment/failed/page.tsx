'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { XCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react'

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const error = searchParams.get('error')

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'missing_params':
        return 'Paramètres de paiement manquants'
      case 'verification_failed':
        return 'Échec de la vérification du paiement'
      case 'transaction_not_found':
        return 'Transaction introuvable'
      case 'server_error':
        return 'Erreur serveur temporaire'
      default:
        return 'Le paiement n\'a pas pu être traité'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
      <header className="bg-white/90 backdrop-blur-md border-b border-red-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/logo.png" alt="GIC Logo" width={40} height={40} className="rounded-lg" />
            <span className="font-bold text-xl bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              GIC CashTransfer
            </span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 p-8 text-center">
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Paiement échoué</h1>
            <p className="text-red-100 text-lg">Une erreur s'est produite lors du traitement</p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="bg-red-50 rounded-2xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-red-900 mb-2">Détails de l'erreur</h2>
                <p className="text-red-700 bg-white px-4 py-2 rounded-lg border border-red-200">
                  {getErrorMessage(error)}
                </p>
                {ref && (
                  <div className="mt-4">
                    <p className="text-sm text-red-600 mb-1">Référence de transaction :</p>
                    <p className="font-mono font-bold text-red-800">{ref}</p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 mb-6">
                <h3 className="font-semibold text-yellow-900 mb-2">Que faire maintenant ?</h3>
                <ul className="text-sm text-yellow-700 space-y-1 text-left">
                  <li>• Vérifiez les informations de votre carte</li>
                  <li>• Assurez-vous d'avoir suffisamment de fonds</li>
                  <li>• Contactez votre banque si nécessaire</li>
                  <li>• Réessayez le paiement</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/transfer/payment"
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Réessayer le paiement
              </Link>

              <Link
                href="/transfer"
                className="w-full border-2 border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Modifier le transfert
              </Link>

              <Link
                href="/"
                className="w-full border-2 border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center"
              >
                <Home className="mr-2 h-5 w-5" />
                Retour à l'accueil
              </Link>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Besoin d'aide ?</h3>
              <p className="text-sm text-blue-700 mb-2">
                Si le problème persiste, contactez notre support client :
              </p>
              <Link
                href="/support"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
              >
                Contacter le support →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
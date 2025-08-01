'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Search, ArrowLeft } from 'lucide-react'

interface TrackForm {
  reference: string
}

export default function TrackPage() {
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<TrackForm>()

  const onSubmit = async (data: TrackForm) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/transactions?reference=${data.reference}`)
      const result = await response.json()
      
      if (response.ok) {
        setTransaction(result)
      } else {
        toast.error('Transaction non trouvée')
        setTransaction(null)
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PAID': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente'
      case 'PAID': return 'Payé'
      case 'APPROVED': return 'Approuvé'
      case 'REJECTED': return 'Rejeté'
      case 'COMPLETED': return 'Terminé'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo.png" alt="GIC Logo" width={32} height={32} />
              <span className="font-bold text-lg">GIC CashTransfer</span>
            </Link>
            <Link href="/" className="flex items-center text-gray-600 hover:text-primary-600">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Suivre votre transfert
            </h1>
            <p className="text-gray-600">
              Entrez votre référence de transaction pour voir le statut de votre transfert
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  {...register('reference', { required: 'Référence requise' })}
                  className="input"
                  placeholder="Ex: GIC1234567890ABCD"
                />
                {errors.reference && (
                  <p className="text-red-500 text-sm mt-1">{errors.reference.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center px-6"
              >
                {loading ? 'Recherche...' : 'Rechercher'}
                <Search className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Transaction Details */}
          {transaction && (
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Détails de la transaction</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                  {getStatusText(transaction.status)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Transaction Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Référence</p>
                    <p className="font-medium">{transaction.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Montant</p>
                    <p className="font-medium">
                      {transaction.amount} {transaction.senderCountry.currencyCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Frais</p>
                    <p className="font-medium">
                      {transaction.fees} {transaction.senderCountry.currencyCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-medium text-lg">
                      {transaction.totalAmount} {transaction.senderCountry.currencyCode}
                    </p>
                  </div>
                </div>

                {/* Sender & Receiver */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Expéditeur</p>
                    <p className="font-medium">{transaction.senderName}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.senderCountry.name} ({transaction.senderCountry.currencyCode})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Destinataire</p>
                    <p className="font-medium">{transaction.receiverName}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.receiverCountry.name} ({transaction.receiverCountry.currencyCode})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Méthode de paiement</p>
                    <p className="font-medium">{transaction.paymentMethod.name}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold mb-4">Historique</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-primary-600 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">Transaction créée</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {transaction.status !== 'PENDING' && (
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        transaction.status === 'APPROVED' || transaction.status === 'COMPLETED' 
                          ? 'bg-green-600' 
                          : 'bg-red-600'
                      }`}></div>
                      <div>
                        <p className="font-medium">
                          {transaction.status === 'APPROVED' ? 'Transaction approuvée' : 
                           transaction.status === 'REJECTED' ? 'Transaction rejetée' :
                           'Transaction mise à jour'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.updatedAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 pt-6 border-t flex gap-4">
                <Link 
                  href={`/support?transaction=${transaction.reference}`}
                  className="btn-secondary"
                >
                  Contacter le support
                </Link>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Télécharger la facture
                </button>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Besoin d'aide ?</h3>
            <p className="text-blue-800 mb-4">
              Si vous ne trouvez pas votre transaction ou avez des questions, notre équipe support est là pour vous aider.
            </p>
            <Link href="/support" className="text-blue-600 hover:text-blue-800 font-medium">
              Contacter le support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
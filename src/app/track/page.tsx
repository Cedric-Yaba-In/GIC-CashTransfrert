'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Search, Package, Clock, CheckCircle, XCircle, AlertCircle, Download, Mail, MessageCircle, Copy, ExternalLink, ArrowRight } from 'lucide-react'
import Header from '@/components/Header'

interface TrackForm {
  reference: string
}

export default function TrackPage() {
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchAttempted, setSearchAttempted] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TrackForm>()
  const reference = watch('reference')

  const onSubmit = async (data: TrackForm) => {
    setLoading(true)
    setSearchAttempted(true)
    try {
      const response = await fetch(`/api/transactions?reference=${data.reference}`)
      const result = await response.json()
      
      if (response.ok) {
        setTransaction(result)
        toast.success('Transaction trouvée!')
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

  const copyReference = () => {
    if (transaction?.reference) {
      navigator.clipboard.writeText(transaction.reference)
      toast.success('Référence copiée!')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'PAID': return <Package className="h-5 w-5 text-blue-500" />
      case 'APPROVED': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-500" />
      case 'COMPLETED': return <CheckCircle className="h-5 w-5 text-green-500" />
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente de validation'
      case 'PAID': return 'Paiement confirmé'
      case 'APPROVED': return 'Transaction approuvée'
      case 'REJECTED': return 'Transaction rejetée'
      case 'COMPLETED': return 'Transfert terminé'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
              <Search className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Suivre votre transfert
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Entrez votre référence de transaction pour voir le statut en temps réel de votre transfert
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Référence de transaction
                </label>
                <div className="relative">
                  <input
                    {...register('reference', { 
                      required: 'Référence requise',
                      pattern: {
                        value: /^GIC[A-Z0-9]+$/,
                        message: 'Format de référence invalide (ex: GIC1234567890ABCD)'
                      }
                    })}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-colors"
                    placeholder="GIC1234567890ABCD"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {errors.reference && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.reference.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Recherche en cours...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>Rechercher ma transaction</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Transaction Details */}
          {transaction && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Transaction trouvée</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-primary-100">Référence:</span>
                      <span className="text-white font-mono">{transaction.reference}</span>
                      <button
                        onClick={copyReference}
                        className="text-primary-100 hover:text-white transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full border-2 ${getStatusColor(transaction.status)}`}>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transaction.status)}
                      <span className="font-semibold">{getStatusText(transaction.status)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Amount Summary */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8">
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Montant envoyé</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {transaction.amount} {transaction.senderCountry.currencyCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Frais</p>
                      <p className="text-xl font-semibold text-gray-700">
                        {transaction.fees} {transaction.senderCountry.currencyCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total payé</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {transaction.totalAmount} {transaction.senderCountry.currencyCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Sender Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Expéditeur</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <img src={transaction.senderCountry.flag} alt="" className="w-6 h-4 object-cover rounded" />
                        <div>
                          <p className="font-medium">{transaction.senderName}</p>
                          <p className="text-sm text-gray-600">{transaction.senderCountry.name}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>📧 {transaction.senderEmail}</p>
                        <p>📱 {transaction.senderPhone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Receiver Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Destinataire</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <img src={transaction.receiverCountry.flag} alt="" className="w-6 h-4 object-cover rounded" />
                        <div>
                          <p className="font-medium">{transaction.receiverName}</p>
                          <p className="text-sm text-gray-600">{transaction.receiverCountry.name}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>📱 {transaction.receiverPhone}</p>
                        {transaction.receiverEmail && <p>📧 {transaction.receiverEmail}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Historique de la transaction</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Transaction créée</p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    
                    {transaction.status !== 'PENDING' && (
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.status === 'APPROVED' || transaction.status === 'COMPLETED' 
                            ? 'bg-green-600' 
                            : 'bg-red-600'
                        }`}>
                          {transaction.status === 'APPROVED' || transaction.status === 'COMPLETED' ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : (
                            <XCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{getStatusText(transaction.status)}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.updatedAt).toLocaleString('fr-FR')}
                          </p>
                          {transaction.adminNotes && (
                            <p className="text-sm text-gray-700 mt-1 italic bg-gray-50 p-2 rounded">
                              Note: {transaction.adminNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 pt-6 border-t">
                  <button className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors">
                    <Download className="h-4 w-4" />
                    <span>Télécharger la facture</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors">
                    <Mail className="h-4 w-4" />
                    <span>Envoyer par email</span>
                  </button>

                  <Link 
                    href={`/support?email=${transaction.senderEmail}&reference=${transaction.reference}`}
                    className="flex items-center space-x-2 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Contacter le support</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {searchAttempted && !transaction && !loading && (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transaction non trouvée</h3>
              <p className="text-gray-600 mb-6">
                Aucune transaction ne correspond à cette référence. Vérifiez que vous avez saisi la bonne référence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/transfer" className="btn-primary inline-flex items-center">
                  Nouveau transfert
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/support" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Contacter le support
                </Link>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Besoin d'aide ?</h3>
              <p className="text-gray-600 mb-6">
                Notre équipe support est disponible 24/7 pour vous accompagner
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/support" className="btn-primary inline-flex items-center">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Ouvrir un ticket
                </Link>
                <a href="mailto:support@gicpromoteltd.com" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors inline-flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  support@gicpromoteltd.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
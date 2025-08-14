'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useToast } from '@/components/ToastProvider'
import { ArrowLeft, Send, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

interface PaymentMethodAvailability {
  paymentMethodId: string
  paymentMethodName: string
  paymentMethodType: string
  available: boolean
  balance: number
  minAmount: number
  maxAmount: number | null
}

interface PaymentForm {
  paymentMethodId: string
  senderPaymentInfo: {
    cardNumber?: string
    expiryDate?: string
    cvv?: string
    mobileNumber?: string
    bankAccount?: string
    bankCode?: string
  }
  receiverPaymentInfo: {
    mobileNumber?: string
    bankAccount?: string
    bankCode?: string
    accountName?: string
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const toast = useToast()
  const [transferData, setTransferData] = useState<any>(null)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodAvailability[]>([])
  const [receiverPaymentMethods, setReceiverPaymentMethods] = useState<any[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodAvailability | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentForm>()

  const paymentMethodId = watch('paymentMethodId')

  useEffect(() => {
    const storedData = sessionStorage.getItem('transferData')
    if (!storedData) {
      toast.error('Erreur', 'Données de transfert manquantes')
      router.push('/transfer')
      return
    }

    const data = JSON.parse(storedData)
    setTransferData(data)
    
    fetchPaymentMethods(data.senderCountryId, data.receiverCountryId, data.amount)
    fetchReceiverMethods(data.receiverCountryId, data.feeCalculation?.summary?.amountReceived || data.amount)
  }, [])

  useEffect(() => {
    if (paymentMethodId && availablePaymentMethods.length > 0) {
      const method = availablePaymentMethods.find(m => m.paymentMethodId === paymentMethodId)
      setSelectedPaymentMethod(method || null)
    }
  }, [paymentMethodId, availablePaymentMethods])

  const fetchPaymentMethods = async (senderCountryId: string, receiverCountryId: string, amount: number) => {
    try {
      const response = await fetch(`/api/transfer/payment-methods?senderCountryId=${senderCountryId}&receiverCountryId=${receiverCountryId}&amount=${amount}`)
      const data = await response.json()
      
      if (response.ok) {
        const availableMethods = Array.isArray(data) ? data : []
        setAvailablePaymentMethods(availableMethods)
        
        if (availableMethods.length === 0) {
          toast.error('Aucune méthode disponible', 'Le pays de destination n\'a pas suffisamment de fonds')
        }
      } else {
        toast.error('Erreur', 'Impossible de charger les moyens de paiement')
        setAvailablePaymentMethods([])
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de charger les moyens de paiement')
      setAvailablePaymentMethods([])
    }
  }

  const fetchReceiverMethods = async (receiverCountryId: string, amount: number) => {
    try {
      const response = await fetch(`/api/transfer/receiver-methods?receiverCountryId=${receiverCountryId}&amount=${amount}`)
      const data = await response.json()
      
      if (response.ok) {
        setReceiverPaymentMethods(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erreur chargement méthodes destinataire:', error)
      setReceiverPaymentMethods([])
    }
  }

  const onSubmit = async (data: PaymentForm) => {
    setLoading(true)
    try {
      const csrfResponse = await fetch('/api/csrf-token')
      const { csrfToken } = await csrfResponse.json()
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          ...transferData,
          ...data,
          totalAmount: transferData.feeCalculation?.summary?.totalPaid || (transferData.amount + 5),
          fees: transferData.feeCalculation?.fees?.total?.amount || 5,
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('Transaction créée', 'Votre transfert a été créé avec succès')
        sessionStorage.removeItem('transferData')
        router.push(`/track/${result.reference}`)
      } else {
        toast.error('Erreur de création', result.error || 'Impossible de créer la transaction')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setLoading(false)
    }
  }

  if (!transferData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Image src="/logo.png" alt="GIC Logo" width={40} height={40} className="rounded-lg" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GIC CashTransfer</span>
                <p className="text-xs text-gray-500 -mt-1">Finalisation du paiement</p>
              </div>
            </Link>
            <button 
              onClick={() => router.push('/transfer')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au transfert
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <CreditCard className="h-4 w-4 mr-2" />
            Paiement sécurisé
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Finaliser votre transfert
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choisissez votre méthode de paiement et complétez les informations nécessaires
          </p>
        </div>

        {/* Récapitulatif amélioré */}
        <div className="bg-gradient-to-r from-white to-blue-50/50 rounded-3xl shadow-xl border border-blue-100 p-8 mb-8 backdrop-blur-sm">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Récapitulatif du transfert</h2>
              <p className="text-gray-600">Vérifiez les détails avant de procéder au paiement</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/80 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-semibold text-blue-700 mb-3 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Expéditeur
              </h3>
              <div className="space-y-2">
                <p className="text-gray-800 font-medium">{transferData.senderName}</p>
                <p className="text-gray-600 text-sm">{transferData.senderEmail}</p>
                <p className="text-gray-600 text-sm">{transferData.senderPhone}</p>
              </div>
            </div>
            
            <div className="bg-white/80 rounded-2xl p-6 border border-green-100">
              <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Destinataire
              </h3>
              <div className="space-y-2">
                <p className="text-gray-800 font-medium">{transferData.receiverName}</p>
                <p className="text-gray-600 text-sm">{transferData.receiverEmail || 'Non renseigné'}</p>
                <p className="text-gray-600 text-sm">{transferData.receiverPhone}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <h3 className="font-semibold text-purple-700 mb-3 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Montants
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">À envoyer:</span>
                  <span className="font-semibold text-gray-800">{transferData.amount} {transferData.feeCalculation?.senderCurrency || 'USD'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                  <span className="text-purple-700 font-medium">Total à payer:</span>
                  <span className="text-xl font-bold text-purple-600">
                    {Number(transferData.feeCalculation?.summary?.totalPaid || (transferData.amount + 5)).toFixed(2)} {transferData.feeCalculation?.senderCurrency || 'USD'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {step === 1 && (
              <div className="space-y-8 p-8">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Étape 1 sur 3
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                    Choisir la méthode de paiement
                  </h1>
                  <p className="text-gray-600 text-lg">Sélectionnez comment vous souhaitez payer</p>
                </div>

                {availablePaymentMethods.length > 0 ? (
                  <div className="grid gap-6 max-w-4xl mx-auto">
                    {availablePaymentMethods.map((method, index) => {
                      const gradients = [
                        'from-blue-500 to-indigo-600',
                        'from-green-500 to-emerald-600', 
                        'from-purple-500 to-pink-600'
                      ]
                      const bgColors = [
                        'from-blue-50 to-indigo-50',
                        'from-green-50 to-emerald-50',
                        'from-purple-50 to-pink-50'
                      ]
                      const borderColors = [
                        'border-blue-200 hover:border-blue-300',
                        'border-green-200 hover:border-green-300',
                        'border-purple-200 hover:border-purple-300'
                      ]
                      
                      return (
                        <div
                          key={method.paymentMethodId}
                          className={`relative border-2 rounded-2xl p-8 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
                            paymentMethodId === method.paymentMethodId
                              ? `border-blue-400 bg-gradient-to-r ${bgColors[index % 3]} shadow-lg scale-[1.02]`
                              : `${borderColors[index % 3]} bg-white hover:shadow-lg`
                          }`}
                          onClick={() => setValue('paymentMethodId', method.paymentMethodId)}
                        >
                          {paymentMethodId === method.paymentMethodId && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-full shadow-lg">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`bg-gradient-to-r ${gradients[index % 3]} p-4 rounded-2xl mr-6 shadow-lg`}>
                                <CreditCard className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{method.paymentMethodName}</h3>
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium text-green-700">Disponible</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Solde: <span className="font-semibold text-gray-800">{method.balance.toFixed(2)} {transferData.feeCalculation?.senderCurrency || 'USD'}</span>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                  Limites: {method.minAmount} - {method.maxAmount || '∞'} {transferData.feeCalculation?.senderCurrency || 'USD'}
                                </div>
                              </div>
                            </div>
                            
                            <div className={`w-6 h-6 rounded-full border-3 transition-all duration-200 ${
                              paymentMethodId === method.paymentMethodId
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {paymentMethodId === method.paymentMethodId && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <input
                      {...register('paymentMethodId', { required: 'Méthode de paiement requise' })}
                      type="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center py-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl border-2 border-dashed border-gray-300">
                      <div className="bg-gradient-to-r from-red-100 to-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Fonds insuffisants</h3>
                      <p className="text-gray-600 text-lg max-w-md mx-auto">Le pays de destination n'a pas suffisamment de fonds pour ce montant</p>
                      <button
                        onClick={() => router.push('/transfer')}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                      >
                        Modifier le montant
                      </button>
                    </div>
                    
                    {receiverPaymentMethods.length > 0 && (
                      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-4">Méthodes disponibles pour la réception :</h4>
                        <div className="grid gap-3">
                          {receiverPaymentMethods.map(method => (
                            <div key={method.paymentMethodId} className="bg-white rounded-lg p-4 border border-blue-200">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">{method.paymentMethodName}</span>
                                <span className="text-sm text-gray-600">
                                  Solde: {method.balance.toFixed(2)} {method.currencyCode}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {availablePaymentMethods.length > 0 && (
                  <div className="flex justify-center pt-8">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!paymentMethodId}
                      className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                    >
                      Continuer →
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && selectedPaymentMethod && (
              <div className="space-y-8 p-8">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-medium mb-4">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Étape 2 sur 3
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                    Informations de paiement
                  </h1>
                  <p className="text-gray-600 text-lg">Renseignez vos informations pour <span className="font-semibold text-gray-800">{selectedPaymentMethod.paymentMethodName}</span></p>
                </div>

                {selectedPaymentMethod.paymentMethodType === 'FLUTTERWAVE' && (
                  <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-blue-900 mb-4">Informations de carte bancaire</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de carte *
                        </label>
                        <input
                          {...register('senderPaymentInfo.cardNumber', { required: 'Numéro de carte requis' })}
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date d'expiration *
                        </label>
                        <input
                          {...register('senderPaymentInfo.expiryDate', { required: 'Date d\'expiration requise' })}
                          type="text"
                          placeholder="MM/AA"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          {...register('senderPaymentInfo.cvv', { required: 'CVV requis' })}
                          type="text"
                          placeholder="123"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod.paymentMethodType === 'MOBILE_MONEY' && (
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="font-semibold text-green-900 mb-4">Informations Mobile Money</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de téléphone Mobile Money *
                      </label>
                      <input
                        {...register('senderPaymentInfo.mobileNumber', { required: 'Numéro Mobile Money requis' })}
                        type="tel"
                        placeholder="+225 01 23 45 67 89"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {selectedPaymentMethod.paymentMethodType === 'BANK_TRANSFER' && (
                  <div className="bg-purple-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-purple-900 mb-4">Informations bancaires</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de compte *
                        </label>
                        <input
                          {...register('senderPaymentInfo.bankAccount', { required: 'Numéro de compte requis' })}
                          type="text"
                          placeholder="1234567890"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code banque *
                        </label>
                        <input
                          {...register('senderPaymentInfo.bankCode', { required: 'Code banque requis' })}
                          type="text"
                          placeholder="ABCD1234"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-8">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                  >
                    ← Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                  >
                    Continuer →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && selectedPaymentMethod && (
              <div className="space-y-8 p-8">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                    <Send className="h-4 w-4 mr-2" />
                    Étape 3 sur 3
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                    Informations du destinataire
                  </h1>
                  <p className="text-gray-600 text-lg">Comment le destinataire recevra-t-il l'argent ?</p>
                </div>

                {selectedPaymentMethod.paymentMethodType === 'MOBILE_MONEY' && (
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="font-semibold text-green-900 mb-4">Réception via Mobile Money</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro Mobile Money du destinataire *
                      </label>
                      <input
                        {...register('receiverPaymentInfo.mobileNumber', { required: 'Numéro Mobile Money requis' })}
                        type="tel"
                        placeholder="+225 01 23 45 67 89"
                        defaultValue={transferData.receiverPhone}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {selectedPaymentMethod.paymentMethodType === 'BANK_TRANSFER' && (
                  <div className="bg-purple-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-purple-900 mb-4">Compte bancaire du destinataire</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom du titulaire du compte *
                        </label>
                        <input
                          {...register('receiverPaymentInfo.accountName', { required: 'Nom du titulaire requis' })}
                          type="text"
                          placeholder="Nom complet"
                          defaultValue={transferData.receiverName}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de compte *
                        </label>
                        <input
                          {...register('receiverPaymentInfo.bankAccount', { required: 'Numéro de compte requis' })}
                          type="text"
                          placeholder="1234567890"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code banque / SWIFT *
                        </label>
                        <input
                          {...register('receiverPaymentInfo.bankCode', { required: 'Code banque requis' })}
                          type="text"
                          placeholder="ABCD1234"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod.paymentMethodType === 'FLUTTERWAVE' && (
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-4">Réception via Flutterwave</h3>
                    <p className="text-blue-700 mb-4">Le destinataire recevra l'argent directement sur son compte Flutterwave ou par Mobile Money selon sa préférence.</p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de téléphone du destinataire *
                      </label>
                      <input
                        {...register('receiverPaymentInfo.mobileNumber', { required: 'Numéro de téléphone requis' })}
                        type="tel"
                        placeholder="+225 01 23 45 67 89"
                        defaultValue={transferData.receiverPhone}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-8">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Traitement...
                      </>
                    ) : (
                      <>
                        Lancer le paiement
                        <Send className="ml-3 h-6 w-6" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
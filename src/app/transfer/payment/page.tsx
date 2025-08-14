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
        const availableMethods = Array.isArray(data) ? data.filter((m: any) => m.available) : []
        setAvailablePaymentMethods(availableMethods)
        
        if (availableMethods.length === 0) {
          toast.error('Aucune méthode disponible', 'Aucun moyen de paiement n\'a suffisamment de fonds')
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Image src="/logo.png" alt="GIC Logo" width={40} height={40} className="rounded-lg" />
                <div className="absolute inset-0 bg-primary-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div>
                <span className="font-bold text-xl text-gray-900">GIC CashTransfer</span>
                <p className="text-xs text-gray-500 -mt-1">Finalisation du paiement</p>
              </div>
            </Link>
            <button 
              onClick={() => router.push('/transfer')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au transfert
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Récapitulatif du transfert</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Expéditeur</h3>
              <p className="text-gray-600">{transferData.senderName}</p>
              <p className="text-gray-600">{transferData.senderEmail}</p>
              <p className="text-gray-600">{transferData.senderPhone}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Destinataire</h3>
              <p className="text-gray-600">{transferData.receiverName}</p>
              <p className="text-gray-600">{transferData.receiverEmail || 'Non renseigné'}</p>
              <p className="text-gray-600">{transferData.receiverPhone}</p>
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Montant à envoyer:</span>
              <span className="text-lg font-bold">{transferData.amount} {transferData.feeCalculation?.senderCurrency || 'USD'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total à payer:</span>
              <span className="text-xl font-bold text-primary-600">
                {Number(transferData.feeCalculation?.summary?.totalPaid || (transferData.amount + 5)).toFixed(2)} {transferData.feeCalculation?.senderCurrency || 'USD'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Choisir la méthode de paiement</h1>
                  <p className="text-gray-600">Sélectionnez comment vous souhaitez payer</p>
                </div>

                {availablePaymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {availablePaymentMethods.map(method => (
                      <div
                        key={method.paymentMethodId}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                          paymentMethodId === method.paymentMethodId
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setValue('paymentMethodId', method.paymentMethodId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-primary-100 p-3 rounded-lg mr-4">
                              <CreditCard className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{method.paymentMethodName}</h3>
                              <p className="text-sm text-gray-600">
                                Solde disponible: {method.balance.toFixed(2)} {transferData.feeCalculation?.senderCurrency || 'USD'}
                              </p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            paymentMethodId === method.paymentMethodId
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          }`}>
                            {paymentMethodId === method.paymentMethodId && (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <input
                      {...register('paymentMethodId', { required: 'Méthode de paiement requise' })}
                      type="hidden"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune méthode disponible</h3>
                    <p className="text-gray-600">Aucun moyen de paiement n'a suffisamment de fonds pour ce montant</p>
                  </div>
                )}

                {availablePaymentMethods.length > 0 && (
                  <div className="flex justify-center pt-6">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!paymentMethodId}
                      className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Continuer
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && selectedPaymentMethod && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Informations de paiement</h1>
                  <p className="text-gray-600">Renseignez vos informations pour {selectedPaymentMethod.paymentMethodName}</p>
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

                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {step === 3 && selectedPaymentMethod && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Informations du destinataire</h1>
                  <p className="text-gray-600">Comment le destinataire recevra-t-il l'argent ?</p>
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

                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Traitement...
                      </>
                    ) : (
                      <>
                        Lancer le paiement
                        <Send className="ml-2 h-5 w-5" />
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
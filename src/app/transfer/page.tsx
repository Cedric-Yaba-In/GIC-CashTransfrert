'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft, Send } from 'lucide-react'

interface Country {
  id: string
  name: string
  code: string
  currency: string
  currencyCode: string
  flag: string
  paymentMethods: any[]
}

interface TransferForm {
  senderName: string
  senderEmail: string
  senderPhone: string
  senderCountryId: string
  receiverName: string
  receiverEmail?: string
  receiverPhone: string
  receiverCountryId: string
  amount: number
  paymentMethodId: string
}

export default function TransferPage() {
  const router = useRouter()
  const [countries, setCountries] = useState<Country[]>([])
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TransferForm>()

  const senderCountryId = watch('senderCountryId')
  const receiverCountryId = watch('receiverCountryId')
  const amount = watch('amount')

  useEffect(() => {
    fetchCountries()
  }, [])

  useEffect(() => {
    if (senderCountryId && receiverCountryId && amount) {
      fetchPaymentMethods()
    }
  }, [senderCountryId, receiverCountryId, amount])

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/countries')
      const data = await response.json()
      setCountries(data)
    } catch (error) {
      toast.error('Erreur lors du chargement des pays')
    }
  }

  const fetchPaymentMethods = async () => {
    const senderCountry = countries.find(c => c.id === senderCountryId)
    if (!senderCountry) return

    const methods = senderCountry.paymentMethods.filter(pm => 
      pm.paymentMethod.active && 
      pm.active &&
      amount >= pm.minAmount &&
      (!pm.maxAmount || amount <= pm.maxAmount)
    )

    setAvailablePaymentMethods(methods)
  }

  const onSubmit = async (data: TransferForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount.toString()),
          totalAmount: parseFloat(data.amount.toString()) + 5, // Frais fixes de 5
          fees: 5,
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('Transaction créée avec succès!')
        router.push(`/track/${result.reference}`)
      } else {
        toast.error(result.error || 'Erreur lors de la création')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
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
              Nouveau transfert d'argent
            </h1>
            <p className="text-gray-600">
              Remplissez le formulaire pour envoyer de l'argent rapidement et en sécurité
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2">Informations</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2">Paiement</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                {/* Sender Information */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Informations de l'expéditeur</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom complet *</label>
                      <input
                        {...register('senderName', { required: 'Nom requis' })}
                        className="input"
                        placeholder="Votre nom complet"
                      />
                      {errors.senderName && (
                        <p className="text-red-500 text-sm mt-1">{errors.senderName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        {...register('senderEmail', { 
                          required: 'Email requis',
                          pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' }
                        })}
                        type="email"
                        className="input"
                        placeholder="votre@email.com"
                      />
                      {errors.senderEmail && (
                        <p className="text-red-500 text-sm mt-1">{errors.senderEmail.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Téléphone *</label>
                      <input
                        {...register('senderPhone', { required: 'Téléphone requis' })}
                        className="input"
                        placeholder="+33 1 23 45 67 89"
                      />
                      {errors.senderPhone && (
                        <p className="text-red-500 text-sm mt-1">{errors.senderPhone.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pays *</label>
                      <select
                        {...register('senderCountryId', { required: 'Pays requis' })}
                        className="input"
                      >
                        <option value="">Sélectionner un pays</option>
                        {countries.map(country => (
                          <option key={country.id} value={country.id}>
                            {country.name} ({country.currencyCode})
                          </option>
                        ))}
                      </select>
                      {errors.senderCountryId && (
                        <p className="text-red-500 text-sm mt-1">{errors.senderCountryId.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Receiver Information */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Informations du destinataire</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom complet *</label>
                      <input
                        {...register('receiverName', { required: 'Nom requis' })}
                        className="input"
                        placeholder="Nom du destinataire"
                      />
                      {errors.receiverName && (
                        <p className="text-red-500 text-sm mt-1">{errors.receiverName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email (optionnel)</label>
                      <input
                        {...register('receiverEmail')}
                        type="email"
                        className="input"
                        placeholder="email@destinataire.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Téléphone *</label>
                      <input
                        {...register('receiverPhone', { required: 'Téléphone requis' })}
                        className="input"
                        placeholder="+33 1 23 45 67 89"
                      />
                      {errors.receiverPhone && (
                        <p className="text-red-500 text-sm mt-1">{errors.receiverPhone.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pays de destination *</label>
                      <select
                        {...register('receiverCountryId', { required: 'Pays requis' })}
                        className="input"
                      >
                        <option value="">Sélectionner un pays</option>
                        {countries.map(country => (
                          <option key={country.id} value={country.id}>
                            {country.name} ({country.currencyCode})
                          </option>
                        ))}
                      </select>
                      {errors.receiverCountryId && (
                        <p className="text-red-500 text-sm mt-1">{errors.receiverCountryId.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Montant à envoyer</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Montant *</label>
                      <input
                        {...register('amount', { 
                          required: 'Montant requis',
                          min: { value: 1, message: 'Montant minimum: 1' }
                        })}
                        type="number"
                        step="0.01"
                        className="input"
                        placeholder="100.00"
                      />
                      {errors.amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                      )}
                    </div>
                    {amount && (
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-600">Récapitulatif:</p>
                        <p>Montant: {amount} {countries.find(c => c.id === senderCountryId)?.currencyCode}</p>
                        <p>Frais: 5 {countries.find(c => c.id === senderCountryId)?.currencyCode}</p>
                        <p className="font-semibold">Total: {parseFloat(amount?.toString() || '0') + 5} {countries.find(c => c.id === senderCountryId)?.currencyCode}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-primary"
                    disabled={!senderCountryId || !receiverCountryId || !amount}
                  >
                    Continuer
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Payment Methods */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Méthode de paiement</h3>
                  {availablePaymentMethods.length > 0 ? (
                    <div className="space-y-3">
                      {availablePaymentMethods.map(method => (
                        <label key={method.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            {...register('paymentMethodId', { required: 'Méthode de paiement requise' })}
                            type="radio"
                            value={method.paymentMethodId}
                            className="mr-3"
                          />
                          <div>
                            <p className="font-medium">{method.paymentMethod.name}</p>
                            <p className="text-sm text-gray-600">
                              Min: {method.minAmount} - Max: {method.maxAmount || 'Illimité'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune méthode de paiement disponible pour cette combinaison pays/montant</p>
                  )}
                  {errors.paymentMethodId && (
                    <p className="text-red-500 text-sm mt-2">{errors.paymentMethodId.message}</p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center"
                  >
                    {loading ? 'Création...' : 'Créer le transfert'}
                    <Send className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
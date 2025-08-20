'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useToast } from '@/components/ToastProvider'
import { ArrowLeft, Send, User, Mail, Phone, MapPin, CreditCard, CheckCircle, AlertCircle, Globe, DollarSign } from 'lucide-react'
import PhoneInput from '../../components/PhoneInput'
import CountrySelect from '../../components/CountrySelect'
import PaymentMethodCard from '../../components/PaymentMethodCard'
import TransferProgress from '../../components/TransferProgress'

interface Region {
  id: string
  name: string
  code: string
  countries: Country[]
}

interface Country {
  id: string
  name: string
  code: string
  currency: string
  currencyCode: string
  flag: string
  region: string
  callingCode: string
  paymentMethods: any[]
}

interface PaymentMethodAvailability {
  paymentMethodId: string
  paymentMethodName: string
  paymentMethodType: string
  available: boolean
  balance: number
  minAmount: number
  maxAmount: number | null
}

interface FeeCalculation {
  amount: number
  baseFee: number
  percentageFee: number
  totalFees: number
  totalAmount: number
  exchangeRate: number
  receivedAmount: number
  senderCurrency: string
  receiverCurrency: string
  breakdown: {
    baseFee: { amount: number; currency: string; description: string }
    percentageFee: { amount: number; currency: string; description: string }
  }
}

interface TransferForm {
  senderName: string
  senderEmail: string
  senderPhone: string
  senderRegion: string
  senderCountryId: string
  receiverName: string
  receiverEmail?: string
  receiverPhone: string
  receiverRegion: string
  receiverCountryId: string
  amount: number
  paymentMethodId: string
}

export default function TransferPage() {
  const router = useRouter()
  const toast = useToast()
  const [regions, setRegions] = useState<Region[]>([])
  const [senderCountries, setSenderCountries] = useState<Country[]>([])
  const [receiverCountries, setReceiverCountries] = useState<Country[]>([])
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodAvailability[]>([])
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculation | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransferForm>()

  const senderRegion = watch('senderRegion')
  const receiverRegion = watch('receiverRegion')
  const senderCountryId = watch('senderCountryId')
  const receiverCountryId = watch('receiverCountryId')
  const amount = watch('amount')
  const paymentMethodId = watch('paymentMethodId')
  const senderName = watch('senderName')
  const senderEmail = watch('senderEmail')
  const senderPhone = watch('senderPhone')
  const receiverName = watch('receiverName')
  const receiverPhone = watch('receiverPhone')

  useEffect(() => {
    const initializeData = async () => {
      await fetchRegions()
      
      // Restaurer les données si l'utilisateur revient de la page de paiement
      const storedData = sessionStorage.getItem('transferData')
      if (storedData) {
        const data = JSON.parse(storedData)
        setValue('senderName', data.senderName)
        setValue('senderEmail', data.senderEmail)
        setValue('senderPhone', data.senderPhone)
        setValue('senderRegion', data.senderRegion)
        setValue('senderCountryId', data.senderCountryId)
        setValue('receiverName', data.receiverName)
        setValue('receiverEmail', data.receiverEmail || '')
        setValue('receiverPhone', data.receiverPhone)
        setValue('receiverRegion', data.receiverRegion)
        setValue('receiverCountryId', data.receiverCountryId)
        setValue('amount', data.amount)
        
        // Charger les pays pour les régions sélectionnées
        if (data.senderRegion) {
          await fetchCountriesByRegion(data.senderRegion, 'sender')
        }
        if (data.receiverRegion) {
          await fetchCountriesByRegion(data.receiverRegion, 'receiver')
        }
      }
    }
    
    initializeData()
  }, [])

  useEffect(() => {
    if (senderRegion) {
      fetchCountriesByRegion(senderRegion, 'sender')
    } else {
      setSenderCountries([])
      setValue('senderCountryId', '')
    }
  }, [senderRegion])

  useEffect(() => {
    if (receiverRegion) {
      fetchCountriesByRegion(receiverRegion, 'receiver')
    } else {
      setReceiverCountries([])
      setValue('receiverCountryId', '')
    }
  }, [receiverRegion])

  useEffect(() => {
    if (senderCountryId && receiverCountryId && amount) {
      fetchPaymentMethods()
    }
  }, [senderCountryId, receiverCountryId, amount])

  useEffect(() => {
    if (senderCountryId && receiverCountryId && amount) {
      calculateFees()
    }
  }, [senderCountryId, receiverCountryId, amount])

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/regions')
      const data = await response.json()
      setRegions(Array.isArray(data) ? data : [])
      return true
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les régions')
      setRegions([])
      return false
    }
  }

  const fetchCountriesByRegion = async (regionCode: string, type: 'sender' | 'receiver') => {
    try {
      const response = await fetch(`/api/regions/${regionCode}/countries`)
      const data = await response.json()
      const countries = Array.isArray(data) ? data : []
      
      if (type === 'sender') {
        setSenderCountries(countries)
        // Ne pas réinitialiser si le pays existe dans la nouvelle liste
        if (senderCountryId && !countries.find(c => c.id === senderCountryId)) {
          setValue('senderCountryId', '')
        }
      } else {
        setReceiverCountries(countries)
        // Ne pas réinitialiser si le pays existe dans la nouvelle liste
        if (receiverCountryId && !countries.find(c => c.id === receiverCountryId)) {
          setValue('receiverCountryId', '')
        }
      }
      return true
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les pays')
      if (type === 'sender') {
        setSenderCountries([])
        setValue('senderCountryId', '')
      } else {
        setReceiverCountries([])
        setValue('receiverCountryId', '')
      }
      return false
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`/api/transfer/payment-methods?senderCountryId=${senderCountryId}&receiverCountryId=${receiverCountryId}&amount=${amount}`)
      const data = await response.json()
      setAvailablePaymentMethods(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les moyens de paiement')
      setAvailablePaymentMethods([])
    }
  }



  const calculateFees = async () => {
    try {
      const response = await fetch(`/api/transfer/calculate-fees?senderCountryId=${senderCountryId}&receiverCountryId=${receiverCountryId}&amount=${amount}`)
      const data = await response.json()
      if (response.ok) {
        setFeeCalculation(data)
      }
    } catch (error) {
      console.error('Erreur calcul des frais:', error)
    }
  }

  const onSubmit = async (data: TransferForm) => {
    setLoading(true)
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token')
      const { csrfToken } = await csrfResponse.json()
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount.toString()),
          totalAmount: feeCalculation?.totalAmount || (parseFloat(data.amount.toString()) + 5),
          fees: feeCalculation?.totalFees || 5,
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('Transaction créée', 'Votre transfert a été créé avec succès')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
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
                <p className="text-xs text-gray-500 -mt-1">Transferts internationaux</p>
              </div>
            </Link>
            <Link href="/" className="flex items-center px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-4">
            <Globe className="h-4 w-4 mr-2" />
            Transfert international sécurisé
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nouveau transfert d'argent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Envoyez de l'argent rapidement et en toute sécurité vers plus de 50 pays dans le monde
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Progress Steps */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-8 py-6">
            <TransferProgress
              currentStep={step}
              totalSteps={2}
              steps={[
                {
                  id: 1,
                  title: 'Informations',
                  description: 'Détails du transfert',
                  status: step > 1 ? 'completed' : step === 1 ? 'current' : 'pending'
                },
                {
                  id: 2,
                  title: 'Paiement',
                  description: 'Méthode de paiement',
                  status: step === 2 ? 'current' : 'pending'
                }
              ]}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {step === 1 && (
              <div className="space-y-8">
                {/* Sender Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-xl">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-900">Informations de l'expéditeur</h3>
                      <p className="text-gray-600">Vos coordonnées pour l'envoi</p>
                    </div>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        Nom complet *
                      </label>
                      <input
                        {...register('senderName', { required: 'Nom requis' })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Votre nom complet"
                      />
                      {errors.senderName && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.senderName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        Email *
                      </label>
                      <input
                        {...register('senderEmail', { 
                          required: 'Email requis',
                          pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' }
                        })}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="votre@email.com"
                      />
                      {errors.senderEmail && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.senderEmail.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Globe className="h-4 w-4 mr-2 text-gray-500" />
                        Région *
                      </label>
                      <select
                        {...register('senderRegion', { required: 'Région requise' })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      >
                        <option value="">Sélectionner une région</option>
                        {regions.map(region => (
                          <option key={region.id} value={region.code}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                      {errors.senderRegion && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.senderRegion.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <PhoneInput
                        value={watch('senderPhone') || ''}
                        onChange={(value) => setValue('senderPhone', value)}
                        countries={senderCountries}
                        label="Téléphone"
                        required
                        error={errors.senderPhone?.message}
                        placeholder="123 456 789"
                      />
                      <input
                        {...register('senderPhone', { required: 'Téléphone requis' })}
                        type="hidden"
                      />
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        Pays *
                      </label>
                      <CountrySelect
                        countries={senderCountries}
                        value={senderCountryId || ''}
                        onChange={(value) => {
                          setValue('senderCountryId', value)
                          // Déclencher la validation
                          if (value) {
                            setValue('senderCountryId', value, { shouldValidate: true })
                          }
                        }}
                        placeholder="Sélectionner un pays"
                        disabled={!senderRegion}
                        error={errors.senderCountryId?.message}
                      />
                      <input
                        {...register('senderCountryId', { required: 'Pays requis' })}
                        type="hidden"
                        value={senderCountryId || ''}
                      />
                      {errors.senderCountryId && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.senderCountryId.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Receiver Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-600 p-3 rounded-xl">
                      <Send className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-900">Informations du destinataire</h3>
                      <p className="text-gray-600">Coordonnées de la personne qui recevra l'argent</p>
                    </div>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        Nom complet *
                      </label>
                      <input
                        {...register('receiverName', { required: 'Nom requis' })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Nom du destinataire"
                      />
                      {errors.receiverName && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.receiverName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        Email <span className="text-gray-400">(optionnel)</span>
                      </label>
                      <input
                        {...register('receiverEmail')}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="email@destinataire.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Globe className="h-4 w-4 mr-2 text-gray-500" />
                        Région de destination *
                      </label>
                      <select
                        {...register('receiverRegion', { required: 'Région requise' })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      >
                        <option value="">Sélectionner une région</option>
                        {regions.map(region => (
                          <option key={region.id} value={region.code}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                      {errors.receiverRegion && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.receiverRegion.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <PhoneInput
                        value={watch('receiverPhone') || ''}
                        onChange={(value) => setValue('receiverPhone', value)}
                        countries={receiverCountries}
                        label="Téléphone"
                        required
                        error={errors.receiverPhone?.message}
                        placeholder="123 456 789"
                      />
                      <input
                        {...register('receiverPhone', { required: 'Téléphone requis' })}
                        type="hidden"
                      />
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        Pays de destination *
                      </label>
                      <CountrySelect
                        countries={receiverCountries}
                        value={receiverCountryId || ''}
                        onChange={(value) => {
                          setValue('receiverCountryId', value)
                          // Déclencher la validation
                          if (value) {
                            setValue('receiverCountryId', value, { shouldValidate: true })
                          }
                        }}
                        placeholder="Sélectionner un pays"
                        disabled={!receiverRegion}
                        error={errors.receiverCountryId?.message}
                      />
                      <input
                        {...register('receiverCountryId', { required: 'Pays requis' })}
                        type="hidden"
                        value={receiverCountryId || ''}
                      />
                      {errors.receiverCountryId && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.receiverCountryId.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>



                {/* Amount */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-600 p-3 rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-900">Montant à envoyer</h3>
                      <p className="text-gray-600">Indiquez le montant que vous souhaitez transférer</p>
                    </div>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        Montant *
                      </label>
                      <div className="relative">
                        <input
                          {...register('amount', { 
                            required: 'Montant requis',
                            min: { value: 1, message: 'Montant minimum: 1' }
                          })}
                          type="number"
                          step="0.01"
                          className="w-full px-4 py-4 text-2xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                          placeholder="100.00"
                        />
                        {senderCountries.find(c => c.id === senderCountryId)?.currencyCode && (
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                            {senderCountries.find(c => c.id === senderCountryId)?.currencyCode}
                          </div>
                        )}
                      </div>
                      {errors.amount && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.amount.message}
                        </p>
                      )}
                    </div>
                    {amount && senderCountryId && (
                      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                          Récapitulatif du transfert
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Montant à envoyer:</span>
                            <span className="font-semibold">
                              {amount} {senderCountries.find(c => c.id === senderCountryId)?.currencyCode}
                            </span>
                          </div>
                          {feeCalculation ? (
                            <>
                              {/* Informations sur le taux appliqué */}
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-blue-700">Taux appliqué:</span>
                                  <span className="text-xs font-bold text-blue-800">{feeCalculation.rateInfo.name}</span>
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  Priorité {feeCalculation.rateInfo.priority} - {feeCalculation.rateInfo.type === 'corridor' ? 'Corridor spécifique' : feeCalculation.rateInfo.type === 'country' ? 'Taux par pays' : 'Taux global'}
                                </div>
                              </div>
                              
                              {/* Détail des frais */}
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">{feeCalculation.fees.baseFee.description}:</span>
                                <span className="font-semibold text-red-600">
                                  -{feeCalculation.fees.baseFee.amount} {feeCalculation.fees.baseFee.currency}
                                </span>
                              </div>
                              {feeCalculation.fees.percentageFee.amount > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">{feeCalculation.fees.percentageFee.description}:</span>
                                  <span className="font-semibold text-red-600">
                                    -{Number(feeCalculation.fees.percentageFee.amount || 0).toFixed(2)} {feeCalculation.fees.percentageFee.currency}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center border-t pt-2">
                                <span className="font-medium text-gray-800">Total des frais:</span>
                                <span className="font-bold text-red-600">
                                  -{Number(feeCalculation.fees.total.amount || 0).toFixed(2)} {feeCalculation.fees.total.currency}
                                </span>
                              </div>
                              
                              {/* Taux de change */}
                              {feeCalculation.senderCurrency !== feeCalculation.receiverCurrency && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-green-700">Taux marché:</span>
                                    <span className="text-xs font-medium text-green-800">
                                      1 {feeCalculation.senderCurrency} = {Number(feeCalculation.exchange.marketRate || 0).toFixed(4)} {feeCalculation.receiverCurrency}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-green-700">Taux appliqué (marge {feeCalculation.exchange.margin}%):</span>
                                    <span className="text-xs font-bold text-green-800">
                                      1 {feeCalculation.senderCurrency} = {Number(feeCalculation.exchange.appliedRate || 0).toFixed(4)} {feeCalculation.receiverCurrency}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-green-700">Marge sur change:</span>
                                    <span className="text-xs font-medium text-green-600">
                                      +{Number(feeCalculation.exchange.marginAmount || 0).toFixed(2)} {feeCalculation.senderCurrency}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Montants finaux */}
                              <div className="border-t pt-3 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-bold text-gray-900">Vous payez:</span>
                                  <span className="text-2xl font-bold text-primary-600">
                                    {Number(feeCalculation.summary.totalPaid || 0).toFixed(2)} {feeCalculation.senderCurrency}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Le destinataire reçoit:</span>
                                  <span className="text-lg font-bold text-green-600">
                                    {Number(feeCalculation.summary.amountReceived || 0).toFixed(2)} {feeCalculation.receiverCurrency}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500">Notre revenu total:</span>
                                  <span className="font-medium text-gray-600">
                                    {Number(feeCalculation.summary.totalRevenue || 0).toFixed(2)} {feeCalculation.senderCurrency}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                              <p className="text-sm text-gray-500 mt-2">Calcul des frais...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true)
                      // Vérifier que tous les champs requis sont remplis
                      const isFormValid = senderName && senderEmail && senderPhone && senderRegion && senderCountryId && 
                                         receiverName && receiverPhone && receiverRegion && receiverCountryId && amount
                      
                      if (isFormValid) {
                        // Ajouter les noms des pays et régions
                        const senderCountryData = senderCountries.find(c => c.id === senderCountryId)
                        const receiverCountryData = receiverCountries.find(c => c.id === receiverCountryId)
                        const senderRegionData = regions.find(r => r.code === senderRegion)
                        const receiverRegionData = regions.find(r => r.code === receiverRegion)
                        
                        // Rediriger vers la page de paiement avec les données
                        const transferData = {
                          senderName,
                          senderEmail,
                          senderPhone,
                          senderRegion,
                          senderRegionName: senderRegionData?.name,
                          senderCountryId,
                          senderCountryName: senderCountryData?.name,
                          senderCountryCode: senderCountryData?.currencyCode,
                          receiverName,
                          receiverPhone: watch('receiverPhone'),
                          receiverEmail: watch('receiverEmail'),
                          receiverRegion,
                          receiverRegionName: receiverRegionData?.name,
                          receiverCountryId,
                          receiverCountryName: receiverCountryData?.name,
                          receiverCountryCode: receiverCountryData?.currencyCode,
                          amount,
                          feeCalculation
                        }
                        
                        // Stocker temporairement les données
                        sessionStorage.setItem('transferData', JSON.stringify(transferData))
                        router.push('/transfer/payment')
                      }
                      setLoading(false)
                    }}
                    disabled={loading || !senderName || !senderEmail || !senderPhone || !senderRegion || !senderCountryId || 
                             !receiverName || !receiverPhone || !receiverRegion || !receiverCountryId || !amount}
                    className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Préparation...
                      </>
                    ) : (
                      <>
                        Continuer le paiement
                        <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                {/* Payment Methods */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
                  <div className="flex items-center mb-6">
                    <div className="bg-orange-600 p-3 rounded-xl">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-900">Méthode de paiement</h3>
                      <p className="text-gray-600">Choisissez comment vous souhaitez payer</p>
                    </div>
                  </div>
                  
                  {availablePaymentMethods.length > 0 ? (
                    <div className="grid gap-4">
                      {availablePaymentMethods.map(method => (
                        <PaymentMethodCard
                          key={method.paymentMethodId}
                          method={method}
                          isSelected={paymentMethodId === method.paymentMethodId}
                          onSelect={() => setValue('paymentMethodId', method.paymentMethodId)}
                          disabled={!method.available}
                          currency={receiverCountries.find(c => c.id === receiverCountryId)?.currencyCode || 'N/A'}
                        />
                      ))}
                      <input
                        {...register('paymentMethodId', { required: 'Méthode de paiement requise' })}
                        type="hidden"
                        value={paymentMethodId || ''}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Aucune méthode de paiement disponible</p>
                      <p className="text-gray-400 text-sm">pour cette combinaison pays/montant</p>
                    </div>
                  )}
                  
                  {availablePaymentMethods.length > 0 && availablePaymentMethods.every(m => !m.available) && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mt-6">
                      <div className="flex items-start">
                        <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 mb-1">Fonds insuffisants</h4>
                          <p className="text-yellow-700 text-sm">
                            Aucun moyen de paiement n'a suffisamment de fonds pour ce montant. 
                            Veuillez réduire le montant ou contacter notre support.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {errors.paymentMethodId && (
                    <p className="text-red-500 text-sm flex items-center mt-4">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.paymentMethodId.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-8">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading || availablePaymentMethods.every(m => !m.available)}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Création en cours...
                      </>
                    ) : (
                      <>
                        Créer le transfert
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
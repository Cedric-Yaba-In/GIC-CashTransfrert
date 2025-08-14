'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, DollarSign, Percent, Globe, ArrowRight } from 'lucide-react'
import ExchangeRateDisplay from './ExchangeRateDisplay'
import CorridorExchangeRate from './CorridorExchangeRate'
import FeeCalculatorPreview from './FeeCalculatorPreview'

interface TransferRate {
  id?: number
  name: string
  description?: string
  baseFee: number
  percentageFee: number
  minAmount: number
  maxAmount?: number
  exchangeRateMargin: number
  active: boolean
  isDefault: boolean
}

interface Country {
  id: number
  name: string
  code: string
  currencyCode: string
  flag: string
}

interface TransferRateModalsProps {
  showModal: boolean
  modalType: 'global' | 'country' | 'corridor'
  editingRate: any
  countries: Country[]
  onClose: () => void
  onSave: (data: any) => void
}

export default function TransferRateModals({
  showModal,
  modalType,
  editingRate,
  countries,
  onClose,
  onSave
}: TransferRateModalsProps) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingRate) {
      if (modalType === 'country' && editingRate.countryRates?.length > 0) {
        const countryRate = editingRate.countryRates[0]
        reset({
          countryId: countryRate.countryId,
          baseFee: countryRate.baseFee || '',
          percentageFee: countryRate.percentageFee || '',
          exchangeRateMargin: countryRate.exchangeRateMargin || '',
          active: countryRate.active
        })
      } else if (modalType === 'corridor' && editingRate.corridorRates?.length > 0) {
        const corridor = editingRate.corridorRates[0]
        reset({
          senderCountryId: corridor.senderCountryId,
          receiverCountryId: corridor.receiverCountryId,
          baseFee: corridor.baseFee || '',
          percentageFee: corridor.percentageFee || '',
          exchangeRateMargin: corridor.exchangeRateMargin || '',
          active: corridor.active
        })
      } else {
        reset(editingRate)
      }
    } else {
      reset({
        name: '',
        description: '',
        baseFee: modalType === 'global' ? 5 : '',
        percentageFee: modalType === 'global' ? 2 : '',
        minAmount: modalType === 'global' ? 1 : '',
        maxAmount: '',
        exchangeRateMargin: modalType === 'global' ? 1 : '',
        active: true,
        isDefault: false,
        countryId: '',
        senderCountryId: '',
        receiverCountryId: ''
      })
    }
  }, [editingRate, reset, modalType])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await onSave({
        ...data,
        baseFee: parseFloat(data.baseFee),
        percentageFee: parseFloat(data.percentageFee),
        minAmount: parseFloat(data.minAmount),
        maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
        exchangeRateMargin: parseFloat(data.exchangeRateMargin)
      })
      onClose()
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {modalType === 'global' && (editingRate ? 'Modifier taux global' : 'Nouveau taux global')}
                {modalType === 'country' && (editingRate ? 'Modifier taux pays' : 'Nouveau taux pays')}
                {modalType === 'corridor' && (editingRate ? 'Modifier corridor' : 'Nouveau corridor')}
              </h2>
              <p className="text-white/80 mt-1">
                {modalType === 'global' && 'Configuration des taux par défaut'}
                {modalType === 'country' && 'Taux spécifiques à un pays'}
                {modalType === 'corridor' && 'Taux pour une relation pays-pays'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Configuration selon le type */}
          {modalType === 'global' && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom du taux *
                  </label>
                  <input
                    {...register('name', { required: 'Nom requis' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                    placeholder="Ex: Standard International"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      {...register('active')}
                      type="checkbox"
                      className="rounded border-gray-300 text-[#0B3371] focus:ring-[#0B3371]"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Actif</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('isDefault')}
                      type="checkbox"
                      className="rounded border-gray-300 text-[#0B3371] focus:ring-[#0B3371]"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Taux par défaut</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                  placeholder="Description du taux de transfert..."
                />
              </div>

              {/* Configuration des frais */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Configuration des frais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Frais de base (USD) *
                    </label>
                    <input
                      {...register('baseFee', { required: 'Frais de base requis', min: 0 })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="5.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Frais fixe en dollars US par transaction</p>
                    {errors.baseFee && (
                      <p className="text-red-500 text-sm mt-1">{errors.baseFee.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Commission (%) *
                    </label>
                    <input
                      {...register('percentageFee', { required: 'Commission requise', min: 0 })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="2.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pourcentage du montant envoyé (votre revenu principal)</p>
                    {errors.percentageFee && (
                      <p className="text-red-500 text-sm mt-1">{errors.percentageFee.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Montant minimum (USD) *
                    </label>
                    <input
                      {...register('minAmount', { required: 'Montant minimum requis', min: 0 })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="1.00"
                    />
                    {errors.minAmount && (
                      <p className="text-red-500 text-sm mt-1">{errors.minAmount.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Montant maximum (USD)
                    </label>
                    <input
                      {...register('maxAmount')}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="Illimité"
                    />
                  </div>
                </div>
              </div>

              {/* Taux de change */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Taux de change
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Marge sur taux de change (%) *
                    </label>
                    <input
                      {...register('exchangeRateMargin', { required: 'Marge requise', min: 0 })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="1.00"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Marge appliquée sur le taux de change du marché
                    </p>
                    {errors.exchangeRateMargin && (
                      <p className="text-red-500 text-sm mt-1">{errors.exchangeRateMargin.message as string}</p>
                    )}
                  </div>
                  <div>
                    <ExchangeRateDisplay
                      fromCurrency="USD"
                      toCurrency="EUR"
                      amount={100}
                      className="h-full"
                    />
                  </div>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg mt-4">
                  <p className="text-xs text-blue-800">
                    <strong>Règles de devise :</strong>
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• <strong>Taux global :</strong> Toujours en USD</li>
                    <li>• <strong>Taux par pays :</strong> Dans la devise du pays</li>
                    <li>• <strong>Corridor :</strong> Dans la devise du pays expéditeur</li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-2">
                    Les taux de change sont récupérés en temps réel
                  </p>
                </div>
              </div>
            </div>
          )}

          {modalType === 'country' && (
            <div className="space-y-6">
              {/* Sélection du pays */}
              <div className="bg-orange-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Configuration par pays
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pays concerné *
                  </label>
                  <select
                    {...register('countryId', { required: 'Pays requis' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                  >
                    <option value="">Sélectionner un pays</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.name} ({country.currencyCode})
                      </option>
                    ))}
                  </select>
                  {errors.countryId && (
                    <p className="text-red-500 text-sm mt-1">{errors.countryId.message as string}</p>
                  )}
                </div>
              </div>

              {/* Configuration des frais pour le pays */}
              <div className="bg-orange-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Frais spécifiques au pays
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Frais de base ({countries.find(c => c.id === parseInt(watch('countryId')))?.currencyCode || 'Devise'})
                    </label>
                    <input
                      {...register('baseFee')}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="Laisser vide pour utiliser le taux global"
                    />
                    <p className="text-xs text-gray-500 mt-1">Frais fixe dans la devise du pays sélectionné</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Commission (%)
                    </label>
                    <input
                      {...register('percentageFee')}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="Laisser vide pour utiliser le taux global"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pourcentage spécifique pour ce pays</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Marge taux de change (%)
                    </label>
                    <input
                      {...register('exchangeRateMargin')}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="Laisser vide pour utiliser le taux global"
                    />
                    <p className="text-xs text-gray-500 mt-1">Marge sur le taux de change pour ce pays</p>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        {...register('active')}
                        type="checkbox"
                        className="rounded border-gray-300 text-[#0B3371] focus:ring-[#0B3371]"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Taux actif pour ce pays</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {modalType === 'corridor' && (
            <div className="space-y-6">
              {/* Sélection des pays */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Corridor de transfert
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pays expéditeur *
                    </label>
                    <select
                      {...register('senderCountryId', { required: 'Pays expéditeur requis' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                    >
                      <option value="">Sélectionner un pays</option>
                      {countries.map(country => (
                        <option key={country.id} value={country.id}>
                          {country.name} ({country.currencyCode})
                        </option>
                      ))}
                    </select>
                    {errors.senderCountryId && (
                      <p className="text-red-500 text-sm mt-1">{errors.senderCountryId.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pays destinataire *
                    </label>
                    <select
                      {...register('receiverCountryId', { required: 'Pays destinataire requis' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                    >
                      <option value="">Sélectionner un pays</option>
                      {countries.map(country => (
                        <option key={country.id} value={country.id}>
                          {country.name} ({country.currencyCode})
                        </option>
                      ))}
                    </select>
                    {errors.receiverCountryId && (
                      <p className="text-red-500 text-sm mt-1">{errors.receiverCountryId.message as string}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Taux de change en temps réel */}
              <CorridorExchangeRate
                senderCountryId={watch('senderCountryId')}
                receiverCountryId={watch('receiverCountryId')}
                countries={countries}
              />

              {/* Configuration des frais pour corridor */}
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Frais spécifiques au corridor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Frais de base ({countries.find(c => c.id === parseInt(watch('senderCountryId')))?.currencyCode || 'Devise'})
                    </label>
                    <input
                      {...register('baseFee')}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="Laisser vide pour utiliser le taux global"
                    />
                    <p className="text-xs text-gray-500 mt-1">Frais dans la devise du pays expéditeur</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Commission (%)
                    </label>
                    <input
                      {...register('percentageFee')}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="Laisser vide pour utiliser le taux global"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Marge taux de change (%)
                    </label>
                    <input
                      {...register('exchangeRateMargin')}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                      placeholder="Laisser vide pour utiliser le taux global"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        {...register('active')}
                        type="checkbox"
                        className="rounded border-gray-300 text-[#0B3371] focus:ring-[#0B3371]"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Corridor actif</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          </form>

          {/* Prévisualisation des calculs */}
          <div className="px-6 pb-6">
            <FeeCalculatorPreview
              modalType={modalType}
              baseFee={parseFloat(watch('baseFee')) || undefined}
              percentageFee={parseFloat(watch('percentageFee')) || undefined}
              exchangeRateMargin={parseFloat(watch('exchangeRateMargin')) || undefined}
              countryId={watch('countryId')}
              senderCountryId={watch('senderCountryId')}
              receiverCountryId={watch('receiverCountryId')}
              countries={countries}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-[#0B3371] text-white rounded-xl hover:bg-[#0B3371]/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{editingRate ? 'Modifier' : 'Créer'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
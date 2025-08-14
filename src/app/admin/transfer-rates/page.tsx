'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { Plus, Settings, DollarSign, Globe, ArrowRight, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import ContentLoader from '@/components/ContentLoader'
import TransferRateModals from '@/components/TransferRateModals'

interface TransferRate {
  id: number
  name: string
  description?: string
  baseFee: number
  percentageFee: number
  minAmount: number
  maxAmount?: number
  exchangeRateMargin: number
  active: boolean
  isDefault: boolean
  countryRates: any[]
  corridorRates: any[]
}

interface Country {
  id: number
  name: string
  code: string
  currencyCode: string
  flag: string
}

export default function AdminTransferRatesPage() {
  const router = useRouter()
  const toast = useToast()
  const [globalRates, setGlobalRates] = useState<TransferRate[]>([])
  const [countryRates, setCountryRates] = useState<any[]>([])
  const [corridorRates, setCorridorRates] = useState<any[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'global' | 'country' | 'corridor'>('global')
  const [editingRate, setEditingRate] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{type: string, id: number, name: string} | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [user] = useState({ name: 'Admin', email: 'admin@gicpromoteltd.com' })
  
  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    router.push('/admin')
  }

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [globalRes, countryRes, corridorRes, countriesRes] = await Promise.all([
        fetch('/api/admin/transfer-rates'),
        fetch('/api/admin/country-rates'),
        fetch('/api/admin/transfer-corridors'),
        fetch('/api/countries')
      ])
      
      const globalData = await globalRes.json()
      const countryData = await countryRes.json()
      const corridorData = await corridorRes.json()
      const countriesData = await countriesRes.json()
      
      setGlobalRates(Array.isArray(globalData) ? globalData : [])
      setCountryRates(Array.isArray(countryData) ? countryData : [])
      setCorridorRates(Array.isArray(corridorData) ? corridorData : [])
      setCountries(Array.isArray(countriesData) ? countriesData : [])
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (type: 'global' | 'country' | 'corridor', rate?: any) => {
    setModalType(type)
    setEditingRate(rate || null)
    setShowModal(true)
  }

  const openDeleteModal = (type: string, id: number, name: string) => {
    setDeletingItem({ type, id, name })
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    
    setDeleteLoading(true)
    try {
      const csrfResponse = await fetch('/api/csrf-token')
      const { csrfToken } = await csrfResponse.json()
      
      let url = ''
      if (deletingItem.type === 'global') url = `/api/admin/transfer-rates/${deletingItem.id}`
      else if (deletingItem.type === 'country') url = `/api/admin/country-rates/${deletingItem.id}`
      else if (deletingItem.type === 'corridor') url = `/api/admin/transfer-corridors/${deletingItem.id}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken
        }
      })
      
      if (response.ok) {
        toast.success('Supprimé', 'Élément supprimé avec succès')
        fetchData()
      } else {
        toast.error('Erreur', 'Impossible de supprimer l\'élément')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
      setDeletingItem(null)
    }
  }

  const handleSaveRate = async (data: any) => {
    try {
      const csrfResponse = await fetch('/api/csrf-token')
      const { csrfToken } = await csrfResponse.json()
      
      let url = '/api/admin/transfer-rates'
      if (modalType === 'corridor') {
        url = '/api/admin/transfer-corridors'
      } else if (modalType === 'country') {
        url = '/api/admin/country-rates'
      }
      
      const method = editingRate ? 'PATCH' : 'POST'
      const endpoint = editingRate ? `${url}/${editingRate.id}` : url
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        toast.success('Sauvegardé', 'Configuration mise à jour avec succès')
        fetchData()
      } else {
        toast.error('Erreur', 'Impossible de sauvegarder la configuration')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    }
  }

  return (
    <AdminLayout user={user} onLogout={logout}>
      <ContentLoader loading={loading}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0B3371]">Taux de transfert</h1>
              <p className="text-gray-600 mt-2">Configuration des frais et taux de change</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => openModal('global')}
                className="flex items-center space-x-2 px-4 py-2 bg-[#0B3371] text-white rounded-xl hover:bg-[#0B3371]/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Taux global</span>
              </button>
              <button
                onClick={() => openModal('country')}
                className="flex items-center space-x-2 px-4 py-2 bg-[#F37521] text-white rounded-xl hover:bg-[#F37521]/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Taux par pays</span>
              </button>
              <button
                onClick={() => openModal('corridor')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Corridor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Taux globaux</p>
                <p className="text-3xl font-bold">{globalRates.length}</p>
              </div>
              <Globe className="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-[#F37521] to-[#F37521]/80 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Taux par pays</p>
                <p className="text-3xl font-bold">{countryRates.length}</p>
              </div>
              <Settings className="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Corridors</p>
                <p className="text-3xl font-bold">{corridorRates.length}</p>
              </div>
              <ArrowRight className="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Taux actifs</p>
                <p className="text-3xl font-bold">{globalRates.filter(r => r.active).length + countryRates.filter(r => r.active).length + corridorRates.filter(r => r.active).length}</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>

        {/* Liste des taux globaux */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#0B3371] flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Taux globaux par défaut
            </h2>
          </div>
          <div className="p-6">
            {globalRates.length > 0 ? (
              <div className="grid gap-4">
                {globalRates.map(rate => (
                  <div key={rate.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${rate.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{rate.name}</h3>
                        <p className="text-sm text-gray-500">{rate.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="font-semibold">$USD {rate.baseFee} + {rate.percentageFee}%</p>
                        <p className="text-sm text-gray-500">Marge: {rate.exchangeRateMargin}%</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal('global', rate)}
                          className="p-2 text-gray-400 hover:text-[#0B3371] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal('global', rate.id, rate.name)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {rate.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Défaut</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Aucun taux global configuré</p>
                <button
                  onClick={() => openModal('global')}
                  className="mt-3 text-[#0B3371] hover:underline"
                >
                  Créer le premier taux global
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Taux par pays */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#0B3371] flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Taux spécifiques par pays
            </h2>
          </div>
          <div className="p-6">
            {countryRates.length > 0 ? (
              <div className="grid gap-4">
                {countryRates.map((countryRate: any) => (
                  <div key={countryRate.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${countryRate.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className="flex items-center space-x-2">
                        <img src={countryRate.country.flag} alt="" className="w-6 h-4 rounded" />
                        <span className="font-medium">{countryRate.country.name}</span>
                        <span className="text-sm text-gray-500">({countryRate.country.currencyCode})</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {countryRate.country.currencyCode} {countryRate.baseFee || 'Défaut'} + {countryRate.percentageFee || 'Défaut'}%
                        </p>
                        <p className="text-sm text-gray-500">
                          Marge: {countryRate.exchangeRateMargin || 'Défaut'}%
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal('country', countryRate)}
                          className="p-2 text-gray-400 hover:text-[#F37521] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal('country', countryRate.id, countryRate.country.name)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Aucun taux par pays configuré</p>
                <button
                  onClick={() => openModal('country')}
                  className="mt-3 text-[#F37521] hover:underline"
                >
                  Créer le premier taux par pays
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Aperçu des corridors actifs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#0B3371] flex items-center">
              <ArrowRight className="w-5 h-5 mr-2" />
              Corridors de transfert actifs
            </h2>
          </div>
          <div className="p-6">
            {corridorRates.length > 0 ? (
              <div className="grid gap-4">
                {corridorRates.map((corridor: any) => (
                  <div key={corridor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <img src={corridor.senderCountry.flag} alt="" className="w-6 h-4 rounded" />
                        <span className="font-medium">{corridor.senderCountry.name}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <img src={corridor.receiverCountry.flag} alt="" className="w-6 h-4 rounded" />
                        <span className="font-medium">{corridor.receiverCountry.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold">{corridor.senderCountry.currencyCode} {corridor.baseFee || 'Défaut'} + {corridor.percentageFee || 'Défaut'}%</p>
                        <p className="text-sm text-gray-500">
                          {corridor.senderCountry.currencyCode} → {corridor.receiverCountry.currencyCode}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal('corridor', corridor)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal('corridor', corridor.id, `${corridor.senderCountry.name} → ${corridor.receiverCountry.name}`)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className={`w-3 h-3 rounded-full ${corridor.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ArrowRight className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Aucun corridor configuré</p>
                <button
                  onClick={() => openModal('corridor')}
                  className="mt-3 text-green-600 hover:underline"
                >
                  Créer le premier corridor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modals de configuration */}
        <TransferRateModals
          showModal={showModal}
          modalType={modalType}
          editingRate={editingRate}
          countries={countries}
          onClose={() => setShowModal(false)}
          onSave={handleSaveRate}
        />

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && deletingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer <strong>{deletingItem.name}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Supprimer</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </ContentLoader>
    </AdminLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { Plus, Globe, Settings, Search, Eye, ToggleLeft, ToggleRight, CreditCard, MapPin, DollarSign, X, Check } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import ContentLoader from '@/components/ContentLoader'
import CountrySelect from '@/components/CountrySelect'
import RegionSelect from '@/components/RegionSelect'

interface Country {
  id: number
  name: string
  code: string
  currency: string
  currencyCode: string
  flag: string
  region?: { name: string; id: number; code: string }
  callingCode: string
  active: boolean
  paymentMethods: any[]
}

interface RegionCountry {
  name: { common: string }
  cca2: string
  currencies: Record<string, { name: string; symbol: string }>
  flags: { png: string; svg: string }
  region: string
}

interface Region {
  id: number
  name: string
  code: string
  active: boolean
}

export default function AdminCountriesPage() {
  const router = useRouter()
  const toast = useToast()
  const [countries, setCountries] = useState<Country[]>([])
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [regionCountries, setRegionCountries] = useState<RegionCountry[]>([])
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [modalSearchTerm, setModalSearchTerm] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingRegionCountries, setLoadingRegionCountries] = useState(false)
  const [addingCountries, setAddingCountries] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCountryDetails, setSelectedCountryDetails] = useState<Country | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedCountryConfig, setSelectedCountryConfig] = useState<Country | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [configuring, setConfiguring] = useState<number | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)

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
    fetchCountries()
    fetchRegions()
  }, [])

  useEffect(() => {
    filterCountries()
  }, [countries, searchTerm, filterRegion, filterStatus])

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/countries')
      const data = await response.json()
      setCountries(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les pays')
      setCountries([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/regions')
      const data = await response.json()
      setRegions(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les régions')
    }
  }

  const fetchRegionCountries = async (region: string) => {
    if (!region) return
    
    setLoadingRegionCountries(true)
    try {
      const response = await fetch(`/api/regions/${region}/countries`)
      const data = await response.json()
      setRegionCountries(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les pays de la région')
      setRegionCountries([])
    } finally {
      setLoadingRegionCountries(false)
    }
  }

  const filterCountries = () => {
    let filtered = countries

    if (searchTerm) {
      filtered = filtered.filter(country => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterRegion !== 'all') {
      filtered = filtered.filter(country => country.region?.name === filterRegion)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(country => 
        filterStatus === 'active' ? country.active : !country.active
      )
    }

    setFilteredCountries(filtered)
  }

  const addSelectedCountries = async () => {
    if (selectedCountries.size === 0) {
      toast.error('Aucun pays sélectionné', 'Veuillez sélectionner au moins un pays')
      return
    }

    setAddingCountries(true)
    try {
      const countriesToAdd = regionCountries.filter(country => 
        selectedCountries.has(country.cca2)
      )

      const response = await fetch('/api/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countries: countriesToAdd }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Pays ajoutés', `${selectedCountries.size} pays ajoutés avec ${result.banksAdded || 0} banques synchronisées`)
        fetchCountries()
        setSelectedCountries(new Set())
        setShowAddModal(false)
        setSelectedRegion('')
        setRegionCountries([])
      } else {
        const error = await response.json()
        toast.error('Erreur d\'ajout', error.error || 'Impossible d\'ajouter les pays')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setAddingCountries(false)
    }
  }

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region)
    setSelectedCountries(new Set())
    setModalSearchTerm('')
    if (region) {
      fetchRegionCountries(region)
    } else {
      setRegionCountries([])
    }
  }

  const toggleCountrySelection = (countryCode: string) => {
    const newSelected = new Set(selectedCountries)
    if (newSelected.has(countryCode)) {
      newSelected.delete(countryCode)
    } else {
      newSelected.add(countryCode)
    }
    setSelectedCountries(newSelected)
  }

  const toggleCountryStatus = async (countryId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/countries/${countryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (response.ok) {
        toast.success('Statut mis à jour', `Le pays a été ${!currentStatus ? 'activé' : 'désactivé'}`)
        fetchCountries()
      } else {
        toast.error('Erreur de mise à jour', 'Impossible de modifier le statut')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    }
  }

  const getUniqueRegions = () => {
    const regionNames = countries.map(c => c.region?.name).filter(Boolean) as string[]
    const regions = Array.from(new Set(regionNames))
    return regions.sort()
  }

  const getExistingCountryCodes = () => {
    return new Set(countries.map(c => c.code))
  }

  const getAvailableRegionCountries = () => {
    const existingCodes = getExistingCountryCodes()
    let filtered = regionCountries.filter(country => !existingCodes.has(country.cca2))
    
    if (modalSearchTerm) {
      filtered = filtered.filter(country => 
        country.name.common.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        country.cca2.toLowerCase().includes(modalSearchTerm.toLowerCase())
      )
    }
    
    return filtered
  }

  const getStats = () => {
    const total = countries.length
    const active = countries.filter(c => c.active).length
    const withPayments = countries.filter(c => c.paymentMethods?.length > 0).length
    const regions = getUniqueRegions().length
    
    return { total, active, withPayments, regions }
  }

  const showCountryDetails = (country: Country) => {
    setSelectedCountryDetails(country)
    setShowDetailsModal(true)
  }

  const showCountryConfig = async (country: Country) => {
    setSelectedCountryConfig(country)
    setShowConfigModal(true)
    await fetchPaymentMethods()
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods')
      const data = await response.json()
      
      if (!Array.isArray(data)) {
        setPaymentMethods([])
        return
      }
      
      // Filtrer les méthodes configurées et actives
      let configuredMethods = data.filter((method, index, self) => 
        index === self.findIndex(m => m.id === method.id) &&
        method.isConfigured === true &&
        method.active === true
      )
      
      // Pour BANK_TRANSFER : masquer l'instance de base si une instance spécifique au pays existe
      if (selectedCountryConfig) {
        const hasCountrySpecificBankTransfer = configuredMethods.some(m => 
          m.type === 'BANK_TRANSFER' && 
          m.countries && 
          m.countries.some((country: any) => country.countryId === selectedCountryConfig.id)
        )
        
        if (hasCountrySpecificBankTransfer) {
          // Masquer l'instance de base (celle sans pays spécifique ou avec countries vide)
          configuredMethods = configuredMethods.filter(m => {
            if (m.type === 'BANK_TRANSFER') {
              // Garder seulement les instances avec des pays spécifiques
              return m.countries && m.countries.length > 0
            }
            return true
          })
        }
      }
      
      setPaymentMethods(configuredMethods)
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les méthodes de paiement')
    }
  }

  const addPaymentMethodToCountry = async (paymentMethodId: number) => {
    if (!selectedCountryConfig) return
    
    const method = paymentMethods.find(m => m.id === paymentMethodId)
    
    // Si c'est Bank Transfer, vérifier s'il n'est pas déjà activé
    if (method?.type === 'BANK_TRANSFER') {
      // Vérifier si BANK_TRANSFER est déjà configuré pour ce pays
      const isAlreadyConfigured = (selectedCountryConfig.paymentMethods || []).some(
        (pm: any) => pm.paymentMethod?.type === 'BANK_TRANSFER'
      )
      
      if (isAlreadyConfigured) {
        // Vérifier si c'est une réactivation d'une instance de base désactivée
        const baseMethod = paymentMethods.find(m => 
          m.type === 'BANK_TRANSFER' && 
          m.name === 'Virement bancaire' && 
          (!m.countries || m.countries.length === 0)
        )
        
        if (baseMethod && !baseMethod.active) {
          // Réactiver l'instance de base
          try {
            const response = await fetch(`/api/payment-methods/${baseMethod.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ active: true })
            })
            
            if (response.ok) {
              toast.success('Réactivé', 'L\'instance de base des virements bancaires a été réactivée')
              await fetchPaymentMethods()
              return
            }
          } catch (error) {
            console.error('Erreur réactivation:', error)
          }
        }
        
        toast.error('Déjà activé', 'Les virements bancaires sont déjà activés pour ce pays')
        return
      }
      
      setConfiguring(paymentMethodId)
      try {
        const response = await fetch(`/api/countries/${selectedCountryConfig.id}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: [paymentMethodId] })
        })
        
        if (response.ok) {
          toast.success('Catégorie ajoutée', 'La catégorie BANK_TRANSFER a été activée pour ce pays')
          await fetchCountries()
          const countryResponse = await fetch(`/api/countries`)
          if (countryResponse.ok) {
            const countriesData = await countryResponse.json()
            const updatedCountry = countriesData.find((c: any) => c.id === selectedCountryConfig.id)
            if (updatedCountry) {
              setSelectedCountryConfig(updatedCountry)
            }
          }
        } else {
          toast.error('Erreur', 'Impossible d\'ajouter la catégorie BANK_TRANSFER')
        }
      } catch (error) {
        toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
      } finally {
        setConfiguring(null)
      }
      return
    }
    
    // Pour les autres méthodes, procéder normalement
    setConfiguring(paymentMethodId)
    try {
      const response = await fetch(`/api/countries/${selectedCountryConfig.id}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId })
      })
      
      if (response.ok) {
        toast.success('Méthode ajoutée', 'La méthode de paiement a été configurée pour ce pays')
        await fetchCountries()
        const countryResponse = await fetch(`/api/countries`)
        if (countryResponse.ok) {
          const countriesData = await countryResponse.json()
          const updatedCountry = countriesData.find((c: any) => c.id === selectedCountryConfig.id)
          if (updatedCountry) {
            setSelectedCountryConfig(updatedCountry)
          }
        }
      } else {
        toast.error('Erreur', 'Impossible d\'ajouter la méthode de paiement')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setConfiguring(null)
    }
  }



  const removePaymentMethodFromCountry = async (paymentMethodId: number) => {
    if (!selectedCountryConfig) return
    
    setRemoving(paymentMethodId)
    try {
      const response = await fetch(`/api/countries/${selectedCountryConfig.id}/payment-methods`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId })
      })
      
      if (response.ok) {
        toast.success('Méthode supprimée', 'La méthode de paiement a été supprimée de ce pays')
        await fetchCountries()
        // Récupérer les données fraîches du pays
        const countryResponse = await fetch(`/api/countries`)
        if (countryResponse.ok) {
          const countriesData = await countryResponse.json()
          const updatedCountry = countriesData.find((c: any) => c.id === selectedCountryConfig.id)
          if (updatedCountry) {
            setSelectedCountryConfig(updatedCountry)
          }
        }
      } else {
        toast.error('Erreur', 'Impossible de supprimer la méthode de paiement')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setRemoving(null)
    }
  }

  const stats = getStats()





  return (
    <AdminLayout user={user} onLogout={logout}>
      <ContentLoader loading={loading}>
        {/* Statistiques */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total Pays</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Globe className="w-8 h-8" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Pays Actifs</p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <ToggleRight className="w-8 h-8" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#F37521] to-[#F37521]/80 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Avec Paiements</p>
                  <p className="text-3xl font-bold">{stats.withPayments}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <CreditCard className="w-8 h-8" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Régions</p>
                  <p className="text-3xl font-bold">{stats.regions}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <MapPin className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Recherche et filtres */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent transition-all"
                />
              </div>
              
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent transition-all"
              >
                <option value="all">Toutes les régions</option>
                {getUniqueRegions().map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent transition-all"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs uniquement</option>
                <option value="inactive">Inactifs uniquement</option>
              </select>
            </div>
            
            {/* Ajout de pays */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#F37521] to-[#F37521]/80 hover:from-[#F37521]/90 hover:to-[#F37521]/70 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter des pays</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal d'ajout de pays */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full min-h-[70vh] max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Ajouter des pays</h2>
                    <p className="text-white/80 mt-1">Sélectionnez une région puis choisissez les pays à ajouter</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setSelectedRegion('')
                      setRegionCountries([])
                      setSelectedCountries(new Set())
                      setModalSearchTerm('')
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto min-h-[50vh] max-h-[calc(90vh-200px)]">
                {/* Sélection de région */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    1. Choisissez une région
                  </label>
                  <RegionSelect
                    regions={regions}
                    value={selectedRegion}
                    onChange={handleRegionSelect}
                    placeholder="Sélectionnez une région..."
                  />
                </div>

                {/* Liste des pays de la région */}
                {selectedRegion && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-700">
                        2. Sélectionnez les pays à ajouter
                      </label>
                      {selectedCountries.size > 0 && (
                        <span className="text-sm text-[#F37521] font-medium">
                          {selectedCountries.size} pays sélectionnés
                        </span>
                      )}
                    </div>

                    {/* Barre de recherche dans le modal */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Rechercher un pays dans cette région..."
                        value={modalSearchTerm}
                        onChange={(e) => setModalSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0B3371] focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    {loadingRegionCountries ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-[#0B3371] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-gray-600">Chargement des pays...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {getAvailableRegionCountries().map((country) => {
                          const isSelected = selectedCountries.has(country.cca2)
                          const currency = Object.values(country.currencies || {})[0]
                          
                          return (
                            <div
                              key={country.cca2}
                              onClick={() => toggleCountrySelection(country.cca2)}
                              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                                isSelected 
                                  ? 'border-[#F37521] bg-[#F37521]/5' 
                                  : 'border-gray-200 hover:border-[#0B3371]/30'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <img 
                                    src={country.flags.svg} 
                                    alt={`${country.name.common} flag`}
                                    className="w-10 h-7 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.src = '/placeholder-flag.png'
                                    }}
                                  />
                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#F37521] rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 truncate">{country.name.common}</h4>
                                  <p className="text-sm text-gray-500">{country.cca2}</p>
                                  {currency && (
                                    <p className="text-xs text-gray-400">{currency.name}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {!loadingRegionCountries && getAvailableRegionCountries().length === 0 && (
                      <div className="text-center py-8">
                        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Tous les pays de cette région sont déjà ajoutés</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {selectedCountries.size > 0 && (
                      <span>{selectedCountries.size} pays sélectionnés pour ajout</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setShowAddModal(false)
                        setSelectedRegion('')
                        setRegionCountries([])
                        setSelectedCountries(new Set())
                        setModalSearchTerm('')
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addSelectedCountries}
                      disabled={addingCountries || selectedCountries.size === 0}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#F37521] to-[#F37521]/80 hover:from-[#F37521]/90 hover:to-[#F37521]/70 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingCountries ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      <span>{addingCountries ? 'Ajout...' : `Ajouter ${selectedCountries.size} pays`}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal des détails du pays */}
        {showDetailsModal && selectedCountryDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={selectedCountryDetails.flag} 
                      alt={`${selectedCountryDetails.name} flag`}
                      className="w-12 h-8 object-cover rounded border-2 border-white/20"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-flag.png'
                      }}
                    />
                    <div>
                      <h2 className="text-2xl font-bold">{selectedCountryDetails.name}</h2>
                      <p className="text-white/80">{selectedCountryDetails.code} • {selectedCountryDetails.region?.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedCountryDetails(null)
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-[#0B3371] mb-3 flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Informations générales</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Nom complet</p>
                        <p className="font-medium text-gray-900">{selectedCountryDetails.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Code pays</p>
                        <p className="font-medium text-gray-900">{selectedCountryDetails.code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Région</p>
                        <p className="font-medium text-gray-900">{selectedCountryDetails.region?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Indicatif téléphonique</p>
                        <p className="font-medium text-gray-900">{selectedCountryDetails.callingCode || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F37521]/5 rounded-xl p-4">
                    <h3 className="font-semibold text-[#F37521] mb-3 flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Devise</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Nom de la devise</p>
                        <p className="font-medium text-gray-900">{selectedCountryDetails.currency || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Code devise</p>
                        <p className="font-medium text-gray-900">{selectedCountryDetails.currencyCode || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statut */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-[#0B3371] mb-3 flex items-center space-x-2">
                    <ToggleRight className="w-4 h-4" />
                    <span>Statut</span>
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">État actuel</p>
                      <p className="text-sm text-gray-500">Le pays est actuellement {selectedCountryDetails.active ? 'actif' : 'inactif'}</p>
                    </div>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      selectedCountryDetails.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCountryDetails.active ? '✓ Actif' : '✗ Inactif'}
                    </span>
                  </div>
                </div>

                {/* Méthodes de paiement */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-[#0B3371] mb-3 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Méthodes de paiement</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {(selectedCountryDetails.paymentMethods || []).length} configurées
                    </span>
                  </h3>
                  
                  {(selectedCountryDetails.paymentMethods || []).length > 0 ? (
                    <div className="space-y-3">
                      {(selectedCountryDetails.paymentMethods || []).map((pm: any) => (
                        <div key={pm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#F37521]/10 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-[#F37521]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{pm.paymentMethod?.name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{pm.paymentMethod?.type || 'N/A'}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            pm.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {pm.active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">Aucune méthode de paiement configurée</p>
                      <p className="text-sm text-gray-400 mt-1">Configurez des méthodes de paiement pour ce pays</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedCountryDetails(null)
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Fermer
                  </button>
                  <button 
                    onClick={() => {
                      setShowDetailsModal(false)
                      showCountryConfig(selectedCountryDetails)
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 hover:from-[#0B3371]/90 hover:to-[#0B3371]/70 text-white rounded-xl font-semibold transition-all duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configurer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de configuration des méthodes de paiement */}
        {showConfigModal && selectedCountryConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={selectedCountryConfig.flag} 
                      alt={`${selectedCountryConfig.name} flag`}
                      className="w-12 h-8 object-cover rounded border-2 border-white/20"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-flag.png'
                      }}
                    />
                    <div>
                      <h2 className="text-2xl font-bold">Configuration - {selectedCountryConfig.name}</h2>
                      <p className="text-white/80">Gestion des méthodes de paiement</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowConfigModal(false)
                      setSelectedCountryConfig(null)
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Méthodes de paiement disponibles */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[#0B3371] mb-4 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Méthodes de paiement disponibles</span>
                  </h3>
                  
                  {paymentMethods.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paymentMethods.filter(method => {
                        // Pour BANK_TRANSFER, masquer l'instance de base si une instance spécifique au pays existe
                        if (method.type === 'BANK_TRANSFER') {
                          const hasCountrySpecific = paymentMethods.some(m => 
                            m.type === 'BANK_TRANSFER' && 
                            m.countries && 
                            m.countries.some((country: any) => country.countryId === selectedCountryConfig?.id)
                          )
                          if (hasCountrySpecific) {
                            // Garder seulement les instances avec des pays spécifiques
                            return method.countries && method.countries.length > 0
                          }
                        }
                        return true
                      }).map((method) => {
                        const configuredMethod = (selectedCountryConfig.paymentMethods || []).find(
                          (pm: any) => pm.paymentMethodId === method.id
                        )
                        const isConfigured = !!configuredMethod
                        const isGlobalMethod = method.type === 'FLUTTERWAVE' // Méthodes configurées globalement
                        
                        // Pour BANK_TRANSFER, vérifier s'il est déjà activé (même avec un autre ID)
                        const isBankTransferConfigured = method.type === 'BANK_TRANSFER' && 
                          (selectedCountryConfig.paymentMethods || []).some(
                            (pm: any) => pm.paymentMethod?.type === 'BANK_TRANSFER'
                          )
                        const finalIsConfigured = isConfigured || isBankTransferConfigured
                        
                        return (
                          <div
                            key={method.id}
                            className={`p-4 border-2 rounded-xl transition-all ${
                              finalIsConfigured 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-gray-200 hover:border-[#0B3371]/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-[#F37521]/10 rounded-xl flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-[#F37521]" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{method.name}</h4>
                                  <p className="text-sm text-gray-500">{method.type}</p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                finalIsConfigured 
                                  ? 'bg-green-100 text-green-700' 
                                  : isGlobalMethod 
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                {finalIsConfigured 
                                  ? 'Configuré' 
                                  : isGlobalMethod 
                                    ? 'Configuration globale'
                                    : 'Non configuré'
                                }
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-3">
                              <p>Montant global: {method.minAmount} - {method.maxAmount || '∞'} {selectedCountryConfig.currencyCode}</p>
                              <p>Statut global: {method.active ? 'Actif' : 'Inactif'}</p>
                              {isGlobalMethod && !finalIsConfigured && (
                                <p className="text-blue-600 font-medium mt-1">
                                  🌐 Configuration centralisée - Prêt à utiliser
                                </p>
                              )}
                              {finalIsConfigured && configuredMethod && (
                                <p className="text-[#0B3371] font-medium mt-1">
                                  Config pays: {configuredMethod.minAmount || 'N/A'} - {configuredMethod.maxAmount || '∞'} | Frais: {configuredMethod.fees}%
                                </p>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              {!finalIsConfigured ? (
                                <button
                                  onClick={() => addPaymentMethodToCountry(method.id)}
                                  disabled={configuring === method.id}
                                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-[#0B3371] text-white hover:bg-[#0B3371]/90 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {configuring === method.id ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : null}
                                  <span>
                                    {configuring === method.id 
                                      ? 'Activation...' 
                                      : method.type === 'BANK_TRANSFER'
                                        ? 'Activer les virements'
                                        : isGlobalMethod 
                                          ? 'Activer pour ce pays'
                                          : 'Configurer'
                                    }
                                  </span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => addPaymentMethodToCountry(method.id)}
                                    disabled={configuring === method.id}
                                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {configuring === method.id ? (
                                      <div className="w-4 h-4 border-2 border-yellow-700/30 border-t-yellow-700 rounded-full animate-spin" />
                                    ) : null}
                                    <span>{configuring === method.id ? 'Modification...' : 'Modifier'}</span>
                                  </button>
                                  <button
                                    onClick={() => removePaymentMethodFromCountry(method.id)}
                                    disabled={removing === method.id}
                                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {removing === method.id ? (
                                      <div className="w-4 h-4 border-2 border-red-700/30 border-t-red-700 rounded-full animate-spin" />
                                    ) : null}
                                    <span>{removing === method.id ? 'Suppression...' : 'Supprimer'}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">Aucune méthode de paiement configurée</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Configurez d'abord vos méthodes de paiement dans 
                        <button 
                          onClick={() => window.open('/admin/payment-methods', '_blank')}
                          className="text-[#F37521] hover:underline mx-1"
                        >
                          Méthodes de Paiement
                        </button>
                        avant de les associer aux pays
                      </p>
                    </div>
                  )}
                </div>

                {/* Méthodes configurées pour ce pays */}
                {(selectedCountryConfig.paymentMethods || []).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[#0B3371] mb-4 flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Méthodes configurées pour ce pays</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {(selectedCountryConfig.paymentMethods || []).map((pm: any) => (
                        <div key={pm.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#0B3371]/10 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-[#0B3371]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{pm.paymentMethod?.name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">
                                Configuré le {new Date(pm.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              pm.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {pm.active ? 'Actif' : 'Inactif'}
                            </span>
                            <button 
                              onClick={() => removePaymentMethodFromCountry(pm.paymentMethodId)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              title="Supprimer cette méthode"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span>{(selectedCountryConfig.paymentMethods || []).length} méthode(s) configurée(s)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setShowConfigModal(false)
                        setSelectedCountryConfig(null)
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Fermer
                    </button>
                    {(selectedCountryConfig.paymentMethods || []).length > 0 && (
                      <button 
                        onClick={() => {
                          window.open('/admin/payment-methods', '_blank')
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#F37521] to-[#F37521]/80 hover:from-[#F37521]/90 hover:to-[#F37521]/70 text-white rounded-xl font-semibold transition-all duration-200"
                        title="Ouvrir la gestion des méthodes de paiement"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Gérer les méthodes</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des pays */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <div key={country.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                {/* Header avec drapeau */}
                <div className="relative bg-gradient-to-r from-gray-50 to-blue-50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img 
                          src={country.flag} 
                          alt={`${country.name} flag`}
                          className="w-16 h-12 object-cover rounded-lg shadow-md border-2 border-white"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-flag.png'
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1">
                          <div className={`w-4 h-4 rounded-full border-2 border-white ${
                            country.active ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#0B3371] group-hover:text-[#F37521] transition-colors">{country.name}</h3>
                        <p className="text-gray-600 font-medium">{country.code}</p>
                        <span className="text-xs text-gray-500">{country.region?.name}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleCountryStatus(country.id, country.active)}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      title={country.active ? 'Désactiver' : 'Activer'}
                    >
                      {country.active ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    country.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {country.active ? '✓ Actif' : '✗ Inactif'}
                  </span>
                </div>

                {/* Informations devise */}
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0B3371]/5 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-[#0B3371]" />
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Devise</p>
                      </div>
                      <p className="font-bold text-[#0B3371] truncate" title={country.currency}>{country.currency || 'N/A'}</p>
                    </div>
                    <div className="bg-[#F37521]/5 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-4 h-4 text-[#F37521]" />
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Code</p>
                      </div>
                      <p className="font-bold text-[#F37521]">{country.currencyCode || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Méthodes de paiement */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-[#0B3371] flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Paiements</span>
                    </h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {(country.paymentMethods || []).length} configurées
                    </span>
                  </div>
                  
                  {(country.paymentMethods || []).length > 0 ? (
                    <div className="space-y-2 mb-6">
                      {(country.paymentMethods || []).slice(0, 3).map((pm: any) => (
                        <div key={pm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#F37521]/10 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-[#F37521]" />
                            </div>
                            <span className="font-medium text-[#0B3371] text-sm">{pm.paymentMethod?.name || 'N/A'}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            pm.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {pm.active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      ))}
                      {(country.paymentMethods || []).length > 3 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          +{(country.paymentMethods || []).length - 3} autres méthodes
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 mb-6">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Aucune méthode configurée</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => showCountryConfig(country)}
                      className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-[#0B3371] hover:bg-[#0B3371]/90 text-white rounded-xl transition-colors font-medium text-sm"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configurer</span>
                    </button>
                    <button 
                      onClick={() => showCountryDetails(country)}
                      className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border-2 border-[#F37521] text-[#F37521] hover:bg-[#F37521] hover:text-white rounded-xl transition-colors font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Détails</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-16 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0B3371]/10 to-[#F37521]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-[#0B3371] mb-3">
                  {countries.length === 0 ? 'Aucun pays configuré' : 'Aucun résultat'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {countries.length === 0 
                    ? 'Commencez par ajouter votre premier pays en utilisant le formulaire ci-dessus. Les informations seront automatiquement récupérées depuis RestCountries API.'
                    : 'Aucun pays ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
                  }
                </p>
                <div className="inline-flex items-center space-x-2 text-sm text-[#F37521]">
                  <div className="w-2 h-2 bg-[#F37521] rounded-full animate-pulse"></div>
                  <span>{countries.length === 0 ? 'Prêt pour la configuration...' : 'Modifiez vos filtres'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </ContentLoader>
    </AdminLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { CreditCard, Settings, ToggleLeft, ToggleRight, Edit, Building2, Smartphone, Globe, MapPin, Database } from 'lucide-react'
import { PAYMENT_CATEGORIES, type PaymentCategoryId } from '@/lib/payment-categories'
import AdminLayout from '@/components/AdminLayout'
import ContentLoader from '@/components/ContentLoader'
import CountrySelect from '@/components/CountrySelect'

interface PaymentMethod {
  id: number
  name: string
  type: string
  category: PaymentCategoryId
  subType?: string
  bank?: { id: number; name: string; code: string }
  minAmount: number
  maxAmount: number | null
  active: boolean
  isConfigured?: boolean
  countryCode?: string
  createdAt: string
  updatedAt: string
  countries?: any[]
}

interface Bank {
  id: number
  name: string
  code: string
  countryCode: string
  logo?: string
  website?: string
  swiftCode?: string
  routingNumber?: string
  source: string
  active: boolean
}

interface Country {
  id: number
  name: string
  code: string
  currency: string
  currencyCode: string
  flag: string
  active: boolean
}

type TabType = PaymentCategoryId

export default function AdminPaymentMethodsPage() {
  const router = useRouter()
  const toast = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('HYBRID')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [syncingBanks, setSyncingBanks] = useState(false)
  const [bankStats, setBankStats] = useState<any>(null)
  const [user] = useState({ name: 'Admin', email: 'admin@gicpromoteltd.com' })
  const [showBankModal, setShowBankModal] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [associatingBank, setAssociatingBank] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [bankAccountForm, setBankAccountForm] = useState({
    accountName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
    routingNumber: '',
    branchCode: ''
  })
  
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

  useEffect(() => {
    if (selectedCountry) {
      fetchBanksByCountry(selectedCountry)
    }
  }, [selectedCountry])

  const fetchData = async () => {
    try {
      const [methodsRes, countriesRes] = await Promise.all([
        fetch('/api/payment-methods'),
        fetch('/api/countries')
      ])
      
      const methodsData = await methodsRes.json()
      const countriesData = await countriesRes.json()
      
      setPaymentMethods(Array.isArray(methodsData) ? methodsData : [])
      setCountries(Array.isArray(countriesData) ? countriesData : [])
      
      if (countriesData.length > 0) {
        setSelectedCountry(countriesData[0].code)
      }
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les données')
      setPaymentMethods([])
      setCountries([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBanksByCountry = async (countryCode: string) => {
    setLoadingBanks(true)
    try {
      const response = await fetch(`/api/banks?countryCode=${countryCode}`)
      if (response.ok) {
        const banksData = await response.json()
        setBanks(banksData)
        await loadBankStats(countryCode)
      }
    } catch (error) {
      toast.error('Erreur', 'Impossible de charger les banques')
    } finally {
      setLoadingBanks(false)
    }
  }

  const loadBankStats = async (countryCode: string) => {
    try {
      const response = await fetch(`/api/banks/sync?countryCode=${countryCode}`)
      if (response.ok) {
        const stats = await response.json()
        setBankStats(stats)
      }
    } catch (error) {
      console.error('Erreur stats banques:', error)
    }
  }

  const syncBanksForCountry = async (countryCode: string) => {
    setSyncingBanks(true)
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token')
      const { csrfToken } = await csrfResponse.json()
      
      const response = await fetch('/api/banks/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ countryCode })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success('Synchronisation réussie', result.message)
        await fetchBanksByCountry(countryCode)
      } else {
        const error = await response.json()
        toast.error('Erreur de synchronisation', error.error)
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de synchroniser les banques')
    } finally {
      setSyncingBanks(false)
    }
  }

  const toggleMethodStatus = async (methodId: number, currentStatus: boolean) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token')
      const { csrfToken } = await csrfResponse.json()
      
      const response = await fetch(`/api/payment-methods/${methodId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (response.ok) {
        toast.success('Statut mis à jour', `La méthode a été ${!currentStatus ? 'activée' : 'désactivée'}`)
        fetchData()
      } else {
        toast.error('Erreur de mise à jour', 'Impossible de modifier le statut')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    }
  }

  const associateBank = async () => {
    if (!selectedBank || !bankAccountForm.accountName || !bankAccountForm.accountNumber) {
      toast.error('Informations manquantes', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    setAssociatingBank(true)
    try {
      const selectedCountryData = countries.find(c => c.code === selectedCountry)
      if (!selectedCountryData) {
        toast.error('Erreur', 'Pays non trouvé')
        return
      }

      if (editingMethod) {
        // Mode modification - mettre à jour le compte bancaire existant
        // Get CSRF token
        const csrfResponse = await fetch('/api/csrf-token')
        const { csrfToken } = await csrfResponse.json()
        
        const response = await fetch('/api/bank-accounts', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          },
          body: JSON.stringify({
            bankId: selectedBank.id,
            countryId: selectedCountryData.id,
            ...bankAccountForm
          })
        })

        if (response.ok) {
          toast.success('Configuration mise à jour', 'Les informations du compte bancaire ont été mises à jour')
        } else {
          const error = await response.json()
          toast.error('Erreur de mise à jour', error.error || 'Impossible de mettre à jour le compte')
        }
      } else {
        // Mode association - créer nouvelle association
        // Get CSRF token
        const csrfResponse = await fetch('/api/csrf-token')
        const { csrfToken } = await csrfResponse.json()
        
        const response = await fetch('/api/payment-methods/associate-banks', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          },
          body: JSON.stringify({
            bankId: selectedBank.id,
            countryId: selectedCountryData.id,
            ...bankAccountForm
          })
        })

        if (response.ok) {
          const result = await response.json()
          toast.success('Association réussie', 'La banque a été associée avec succès')
        } else {
          const error = await response.json()
          toast.error('Erreur d\'association', error.error || 'Impossible d\'associer la banque')
        }
      }

      setShowBankModal(false)
      setSelectedBank(null)
      setEditingMethod(null)
      setBankAccountForm({
        accountName: '',
        accountNumber: '',
        iban: '',
        swiftCode: '',
        routingNumber: '',
        branchCode: ''
      })
      await fetchData()
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setAssociatingBank(false)
    }
  }

  const selectBank = (bank: Bank) => {
    setSelectedBank(bank)
    // Pré-remplir avec les informations de la banque si disponibles
    setBankAccountForm({
      accountName: '',
      accountNumber: '',
      iban: '',
      swiftCode: bank.swiftCode || '',
      routingNumber: bank.routingNumber || '',
      branchCode: ''
    })
  }

  const openBankConfiguration = async (method: PaymentMethod) => {
    const bank = banks.find(b => b.id === method.bank?.id)
    if (!bank) return

    // Récupérer les informations du compte bancaire existant
    try {
      const selectedCountryData = countries.find(c => c.code === selectedCountry)
      const response = await fetch(`/api/bank-accounts?bankId=${bank.id}&countryId=${selectedCountryData?.id}`)
      
      if (response.ok) {
        const bankAccounts = await response.json()
        const existingAccount = bankAccounts[0] // Premier compte trouvé
        
        setSelectedBank(bank)
        setBankAccountForm({
          accountName: existingAccount?.accountName || '',
          accountNumber: existingAccount?.accountNumber || '',
          iban: existingAccount?.iban || '',
          swiftCode: existingAccount?.swiftCode || bank.swiftCode || '',
          routingNumber: existingAccount?.routingNumber || bank.routingNumber || '',
          branchCode: existingAccount?.branchCode || ''
        })
        setEditingMethod(method)
        setShowBankModal(true)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du compte bancaire:', error)
      // En cas d'erreur, ouvrir quand même le modal avec les infos de base
      setSelectedBank(bank)
      setBankAccountForm({
        accountName: '',
        accountNumber: '',
        iban: '',
        swiftCode: bank.swiftCode || '',
        routingNumber: bank.routingNumber || '',
        branchCode: ''
      })
      setEditingMethod(method)
      setShowBankModal(true)
    }
  }

  const getAvailableBanksForAssociation = () => {
    const selectedCountryData = countries.find(c => c.code === selectedCountry)
    if (!selectedCountryData) return []

    // Si on édite une méthode existante, retourner toutes les banques
    if (editingMethod) {
      return banks.filter(bank => bank.countryCode === selectedCountry)
    }

    // Récupérer les banques déjà associées
    const associatedBankIds = paymentMethods
      .filter(m => {
        if (m.type === 'BANK_TRANSFER' && m.bank) {
          return m.countries && m.countries.some((country: any) => 
            country.countryId === selectedCountryData.id
          )
        }
        return false
      })
      .map(m => m.bank?.id)
      .filter(Boolean)

    // Retourner les banques non associées
    return banks.filter(bank => 
      bank.countryCode === selectedCountry && 
      !associatedBankIds.includes(bank.id)
    )
  }

  const getFilteredBanks = () => {
    const availableBanks = getAvailableBanksForAssociation()
    if (!searchTerm) return availableBanks
    
    return availableBanks.filter(bank => 
      bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }



  const getMethodsByCategory = (category: PaymentCategoryId) => {
    return paymentMethods.filter(method => method.category === category)
  }

  const getAvailableTabs = () => {
    const tabs = []
    
    // Debug: voir toutes les méthodes de paiement
    console.log('All PaymentMethods:', paymentMethods)
    console.log('BANK_TRANSFER methods:', paymentMethods.filter(m => m.type === 'BANK_TRANSFER'))
    console.log('PaymentMethods for country', selectedCountry, ':', paymentMethods.filter(m => m.countryCode === selectedCountry))
    
    // Tab Hybride : affiché si Flutterwave ou CinetPay est activé pour ce pays
    const selectedCountryData = countries.find(c => c.code === selectedCountry)
    const hybridMethods = paymentMethods.filter(m => {
      if (m.category === 'HYBRID' && (m.type === 'FLUTTERWAVE' || m.type === 'CINETPAY')) {
        // Vérifier si la méthode est associée au pays sélectionné
        return m.countries && m.countries.some((country: any) => 
          country.countryId === selectedCountryData?.id
        )
      }
      return false
    })
    
    if (hybridMethods.length > 0) {
      const categoryConfig = PAYMENT_CATEGORIES.HYBRID
      tabs.push({ 
        id: 'HYBRID' as TabType, 
        name: categoryConfig.name, 
        icon: Globe, 
        count: hybridMethods.length, 
        color: categoryConfig.color 
      })
    }
    
    // Tab Transfert Bancaire : affiché si BANK_TRANSFER existe pour ce pays
    const hasBankTransfer = paymentMethods.some(m => {
      if (m.type === 'BANK_TRANSFER') {
        // Vérifier si la méthode est associée au pays sélectionné
        return m.countries && m.countries.some((country: any) => 
          country.countryId === selectedCountryData?.id
        )
      }
      return false
    })
    
    console.log('Has BANK_TRANSFER for', selectedCountry, ':', hasBankTransfer)
    
    if (hasBankTransfer) {
      const bankMethods = paymentMethods.filter(m => {
        if (m.type === 'BANK_TRANSFER') {
          return m.countries && m.countries.some((country: any) => 
            country.countryId === selectedCountryData?.id
          )
        }
        return false
      })
      // Compter seulement les banques spécifiques associées (avec bank)
      const specificBankMethods = bankMethods.filter(m => m.bank)
      const categoryConfig = PAYMENT_CATEGORIES.BANK_TRANSFER
      tabs.push({ 
        id: 'BANK_TRANSFER' as TabType, 
        name: categoryConfig.name, 
        icon: Building2, 
        count: specificBankMethods.length, 
        color: categoryConfig.color 
      })
    }
    
    // Tab Mobile Money : affiché si des méthodes mobile money existent pour ce pays
    const mobileMethods = getMethodsByCategory('MOBILE_MONEY').filter(m => 
      m.countryCode === selectedCountry
    )
    if (mobileMethods.length > 0) {
      const categoryConfig = PAYMENT_CATEGORIES.MOBILE_MONEY
      tabs.push({ 
        id: 'MOBILE_MONEY' as TabType, 
        name: categoryConfig.name, 
        icon: Smartphone, 
        count: mobileMethods.length, 
        color: categoryConfig.color 
      })
    }
    
    console.log('Available tabs:', tabs)
    return tabs
  }

  const hasBankTransferForCountry = () => {
    const selectedCountryData = countries.find(c => c.code === selectedCountry)
    return selectedCountry && paymentMethods.some(m => {
      if (m.type === 'BANK_TRANSFER') {
        return m.countries && m.countries.some((country: any) => 
          country.countryId === selectedCountryData?.id
        )
      }
      return false
    })
  }

  const availableTabs = getAvailableTabs()
  const selectedCountryData = countries.find(c => c.code === selectedCountry)

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id)
    }
  }, [availableTabs, activeTab])

  return (
    <AdminLayout user={user} onLogout={logout}>
      <ContentLoader loading={loading}>
        <div className="mb-8">

          <div className="bg-gradient-to-r from-[#0B3371]/5 to-blue-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0B3371] to-blue-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#0B3371]">Sélection du Pays</h3>
                <p className="text-blue-600 text-sm">Choisissez un pays pour voir les moyens de paiement disponibles</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="w-80">
                <CountrySelect
                  countries={countries.map(c => ({ ...c, id: c.code }))}
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  placeholder="Sélectionner un pays"
                />
              </div>
              
              {bankStats && selectedCountryData && (
                <div className="flex items-center space-x-3">
                  <div className="bg-white/80 backdrop-blur-sm border border-[#0B3371]/20 rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#0B3371] rounded-full"></div>
                      <span className="text-sm font-semibold text-[#0B3371]">FW: {bankStats.stats?.flutterwave || 0}</span>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-green-700">API: {bankStats.stats?.api || 0}</span>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-amber-700">Manuel: {bankStats.stats?.manual || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedCountry && availableTabs.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-6">
              {availableTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const colorClasses = {
                  orange: isActive ? 'bg-gradient-to-r from-[#F37521] to-[#F37521]/90 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200 hover:border-orange-200',
                  blue: isActive ? 'bg-gradient-to-r from-[#0B3371] to-[#0B3371]/90 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200',
                  green: isActive ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-200' : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200 hover:border-green-200'
                }
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${colorClasses[tab.color as keyof typeof colorClasses]}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {!selectedCountry ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Sélectionnez un pays</h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                Choisissez un pays dans le sélecteur ci-dessus pour voir les moyens de paiement disponibles.
              </p>
            </div>
          </div>
        ) : availableTabs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun moyen de paiement</h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                Ce pays n'a aucun moyen de paiement configuré. Contactez l'administrateur pour en ajouter.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {activeTab === 'HYBRID' && (
              <div className="p-6">
                {(() => {
                  const selectedCountryData = countries.find(c => c.code === selectedCountry)
                  return paymentMethods.filter(m => {
                    if (m.category === 'HYBRID' && (m.type === 'FLUTTERWAVE' || m.type === 'CINETPAY')) {
                      return m.countries && m.countries.some((country: any) => 
                        country.countryId === selectedCountryData?.id
                      )
                    }
                    return false
                  })
                })().length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(() => {
                      const selectedCountryData = countries.find(c => c.code === selectedCountry)
                      return paymentMethods.filter(m => {
                        if (m.category === 'HYBRID' && (m.type === 'FLUTTERWAVE' || m.type === 'CINETPAY')) {
                          return m.countries && m.countries.some((country: any) => 
                            country.countryId === selectedCountryData?.id
                          )
                        }
                        return false
                      })
                    })().map((method) => (
                      <div key={method.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center ${
                              method.type === 'CINETPAY' 
                                ? 'from-[#F37521]/10 to-[#F37521]/20' 
                                : 'from-blue-500/10 to-blue-500/20'
                            }`}>
                              <Globe className={`w-5 h-5 ${
                                method.type === 'CINETPAY' ? 'text-[#F37521]' : 'text-blue-500'
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{method.name}</h3>
                              <p className={`text-sm ${
                                method.type === 'CINETPAY' ? 'text-[#F37521]/70' : 'text-blue-500/70'
                              }`}>
                                API {method.type === 'CINETPAY' ? 'CinetPay' : 'Flutterwave'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              method.isConfigured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {method.isConfigured ? 'Configuré' : 'Non configuré'}
                            </span>
                            
                            <button
                              onClick={() => toggleMethodStatus(method.id, method.active)}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {method.active ? (
                                <ToggleRight className="w-5 h-5 text-green-500" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold">Min</p>
                              <p className="font-bold text-[#0B3371]">{method.minAmount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold">Max</p>
                              <p className="font-bold text-gray-600">{method.maxAmount || '∞'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-[#0B3371] hover:bg-[#0B3371]/90 text-white rounded-lg transition-colors text-sm">
                            <Edit className="w-4 h-4" />
                            <span>Modifier</span>
                          </button>
                          
                          <button 
                            onClick={async () => {
                              try {
                                const endpoint = method.type === 'CINETPAY' ? '/api/cinetpay/sync' : '/api/flutterwave/sync'
                                const response = await fetch(endpoint, { method: 'POST' })
                                const result = await response.json()
                                if (response.ok) {
                                  toast.success('Synchronisation réussie', result.message)
                                } else {
                                  toast.error('Erreur de synchronisation', result.error)
                                }
                              } catch (error) {
                                toast.error('Erreur', 'Impossible de synchroniser les soldes')
                              }
                            }}
                            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-colors text-sm ${
                              method.type === 'CINETPAY'
                                ? 'bg-[#F37521]/10 hover:bg-[#F37521]/20 text-[#F37521] border border-[#F37521]/20'
                                : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20'
                            }`}
                          >
                            <Settings className="w-4 h-4" />
                            <span>Synchroniser soldes</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Aucune méthode hybride configurée</p>
                    <p className="text-sm text-gray-400 mb-6">Flutterwave, CinetPay et autres APIs</p>
                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={async () => {
                          const selectedCountryData = countries.find(c => c.code === selectedCountry)
                          if (!selectedCountryData) return
                          
                          try {
                            // Get CSRF token
                            const csrfResponse = await fetch('/api/csrf-token')
                            const { csrfToken } = await csrfResponse.json()
                            
                            const response = await fetch('/api/payment-methods/create-flutterwave', {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                'x-csrf-token': csrfToken
                              },
                              body: JSON.stringify({ countryId: selectedCountryData.id })
                            })
                            
                            if (response.ok) {
                              toast.success('Flutterwave activé', 'Flutterwave a été activé pour ce pays')
                              await fetchData()
                            } else {
                              const error = await response.json()
                              toast.error('Erreur', error.error)
                            }
                          } catch (error) {
                            toast.error('Erreur de connexion', 'Impossible d\'activer Flutterwave')
                          }
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-200"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Activer Flutterwave</span>
                      </button>
                      <button
                        onClick={async () => {
                          const selectedCountryData = countries.find(c => c.code === selectedCountry)
                          if (!selectedCountryData) return
                          
                          try {
                            // Get CSRF token
                            const csrfResponse = await fetch('/api/csrf-token')
                            const { csrfToken } = await csrfResponse.json()
                            
                            // Créer CinetPay pour ce pays (endpoint à créer)
                            const response = await fetch('/api/payment-methods/create-cinetpay', {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                'x-csrf-token': csrfToken
                              },
                              body: JSON.stringify({ countryId: selectedCountryData.id })
                            })
                            
                            if (response.ok) {
                              toast.success('CinetPay activé', 'CinetPay a été activé pour ce pays')
                              await fetchData()
                            } else {
                              const error = await response.json()
                              toast.error('Erreur', error.error)
                            }
                          } catch (error) {
                            toast.error('Erreur de connexion', 'Impossible d\'activer CinetPay')
                          }
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#F37521] to-[#F37521]/90 text-white hover:from-[#F37521]/90 hover:to-[#F37521]/80 rounded-lg font-medium transition-all shadow-lg hover:shadow-orange-200"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Activer CinetPay</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'BANK_TRANSFER' && (
              <div className="p-6">
                {hasBankTransferForCountry() && (
                  <div className="flex items-center justify-end space-x-3 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mr-3">
                      <p className="text-sm text-blue-700 font-medium">
                        📊 Synchronise banques initiales + APIs (Flutterwave)
                      </p>
                    </div>
                    <button
                      onClick={() => syncBanksForCountry(selectedCountry)}
                      disabled={syncingBanks}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0B3371] to-blue-600 text-white hover:from-[#0B3371]/90 hover:to-blue-500 rounded-lg font-medium transition-all disabled:opacity-50 text-sm shadow-lg hover:shadow-blue-200"
                    >
                      {syncingBanks ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Database className="w-4 h-4" />
                      )}
                      <span>{syncingBanks ? 'Synchronisation...' : 'Synchroniser les banques'}</span>
                    </button>
                    
                    <button
                      onClick={() => setShowBankModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#F37521] to-[#F37521]/90 text-white hover:from-[#F37521]/90 hover:to-[#F37521]/80 rounded-lg font-medium transition-all text-sm shadow-lg hover:shadow-orange-200"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Associer une banque</span>
                    </button>
                  </div>
                )}

                {!hasBankTransferForCountry() ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Building2 className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun moyen de paiement bancaire</h3>
                    <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                      Ce pays n'a pas de moyen de paiement BANK_TRANSFER associé. Contactez l'administrateur pour l'activer.
                    </p>
                  </div>
                ) : loadingBanks ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-600">Chargement des banques...</span>
                  </div>
                ) : (() => {
                  const selectedCountryData = countries.find(c => c.code === selectedCountry)
                  return paymentMethods.filter(m => {
                    if (m.type === 'BANK_TRANSFER' && m.bank) {
                      return m.countries && m.countries.some((country: any) => 
                        country.countryId === selectedCountryData?.id
                      )
                    }
                    return false
                  }).length > 0
                })() ? (
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B3371] mb-4">
                      Banques associées ({(() => {
                        const selectedCountryData = countries.find(c => c.code === selectedCountry)
                        return paymentMethods.filter(m => {
                          if (m.type === 'BANK_TRANSFER' && m.bank) {
                            return m.countries && m.countries.some((country: any) => 
                              country.countryId === selectedCountryData?.id
                            )
                          }
                          return false
                        }).length
                      })()})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(() => {
                        const selectedCountryData = countries.find(c => c.code === selectedCountry)
                        return paymentMethods.filter(m => {
                          if (m.type === 'BANK_TRANSFER' && m.bank) {
                            return m.countries && m.countries.some((country: any) => 
                              country.countryId === selectedCountryData?.id
                            )
                          }
                          return false
                        })
                      })().map((method) => {
                        const bank = banks.find(b => b.id === method.bank?.id)
                        if (!bank) return null
                        
                        const sourceColors = {
                          FLUTTERWAVE: { bg: 'bg-gradient-to-br from-[#0B3371]/5 to-blue-50', badge: 'bg-[#0B3371] text-white', dot: 'bg-[#0B3371]' },
                          API: { bg: 'bg-gradient-to-br from-green-50 to-emerald-50', badge: 'bg-green-500 text-white', dot: 'bg-green-500' },
                          MANUAL: { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', badge: 'bg-amber-500 text-white', dot: 'bg-amber-500' }
                        }
                        const colors = sourceColors[bank.source as keyof typeof sourceColors] || sourceColors.MANUAL
                    
                        return (
                          <div key={method.id} className={`${colors.bg} border border-white/50 rounded-xl p-5 hover:shadow-lg transition-all duration-200 backdrop-blur-sm`}>
                            <div className="flex items-start space-x-4 mb-4">
                              <div className="relative">
                                {bank.logo ? (
                                  <img src={bank.logo} alt={bank.name} className="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-sm" />
                                ) : (
                                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Building2 className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${colors.dot} rounded-full border-2 border-white`}></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 truncate text-lg">{bank.name}</h4>
                                <p className="text-sm text-gray-600 font-medium">{bank.code}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                                    {bank.source === 'FLUTTERWAVE' ? 'Flutterwave' : bank.source === 'API' ? 'API' : 'Manuel'}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    method.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {method.active ? 'Actif' : 'Inactif'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {bank.swiftCode && (
                              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 mb-3 border border-white/50">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Code SWIFT</p>
                                <p className="font-mono text-sm text-[#0B3371] font-bold">{bank.swiftCode}</p>
                              </div>
                            )}
                            
                            {bank.routingNumber && (
                              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 mb-3 border border-white/50">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Routing Number</p>
                                <p className="font-mono text-sm text-[#0B3371] font-bold">{bank.routingNumber}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {bank.website && (
                                  <a
                                    href={bank.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 text-[#0B3371] hover:text-[#0B3371]/80 text-xs font-semibold transition-colors"
                                  >
                                    <Globe className="w-3 h-3" />
                                    <span>Site</span>
                                  </a>
                                )}
                                
                                <button
                                  onClick={() => toggleMethodStatus(method.id, method.active)}
                                  className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                                >
                                  {method.active ? (
                                    <ToggleRight className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </div>
                              
                              <button 
                                onClick={() => openBankConfiguration(method)}
                                className="flex items-center space-x-2 px-3 py-2 bg-[#0B3371] hover:bg-[#0B3371]/90 text-white rounded-lg font-medium transition-colors text-sm"
                              >
                                <Settings className="w-4 h-4" />
                                <span>Configurer</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Aucune banque associée pour ce pays</p>
                    <button 
                      onClick={() => setShowBankModal(true)}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0B3371] to-blue-600 text-white hover:from-[#0B3371]/90 hover:to-blue-500 rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-200 mx-auto"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Associer une banque</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'MOBILE_MONEY' && (
              <div className="p-6">
                {getMethodsByCategory('MOBILE_MONEY').filter(m => m.countryCode === selectedCountry).length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {getMethodsByCategory('MOBILE_MONEY').filter(m => m.countryCode === selectedCountry).map((method) => (
                      <div key={method.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                              <Smartphone className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{method.name}</h3>
                              <p className="text-sm text-green-600">Mobile Money</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => toggleMethodStatus(method.id, method.active)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {method.active ? (
                              <ToggleRight className="w-5 h-5 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold">Min</p>
                              <p className="font-bold text-[#0B3371]">{method.minAmount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold">Max</p>
                              <p className="font-bold text-slate-600">{method.maxAmount || '∞'}</p>
                            </div>
                          </div>
                        </div>

                        <button className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                          <Edit className="w-4 h-4" />
                          <span>Modifier</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Aucune méthode Mobile Money configurée</p>
                    <p className="text-sm text-gray-400 mt-1">Orange Money, MTN Mobile Money (non intégrés)</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ContentLoader>

      {/* Modal de sélection des banques */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Header du modal */}
            <div className="bg-gradient-to-r from-[#0B3371] to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedBank 
                        ? (editingMethod ? 'Modifier le compte bancaire' : 'Configurer le compte bancaire')
                        : 'Sélectionner une banque'
                      }
                    </h2>
                    <p className="text-blue-100 text-sm">
                      {selectedBank 
                        ? `${selectedBank.name} - ${countries.find(c => c.code === selectedCountry)?.name}`
                        : `Pays: ${countries.find(c => c.code === selectedCountry)?.name} (${selectedCountry})`
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBankModal(false)
                    setSelectedBank(null)
                    setBankAccountForm({
                      accountName: '',
                      accountNumber: '',
                      iban: '',
                      swiftCode: '',
                      routingNumber: '',
                      branchCode: ''
                    })
                    setSearchTerm('')
                  }}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-white text-lg font-bold">×</span>
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              {!selectedBank ? (
                <div>
                  {/* Barre de recherche */}
                  <div className="mb-6 relative">
                    <input
                      type="text"
                      placeholder="Rechercher une banque par nom ou code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Liste des banques */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredBanks().map((bank) => {
                      const sourceColors = {
                        FLUTTERWAVE: { bg: 'from-[#0B3371]/5 to-blue-50', border: 'border-[#0B3371]/20', badge: 'bg-[#0B3371] text-white' },
                        API: { bg: 'from-green-50 to-emerald-50', border: 'border-green-200', badge: 'bg-green-500 text-white' },
                        MANUAL: { bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', badge: 'bg-amber-500 text-white' }
                      }
                      const colors = sourceColors[bank.source as keyof typeof sourceColors] || sourceColors.MANUAL

                      return (
                        <div
                          key={bank.id}
                          onClick={() => selectBank(bank)}
                          className={`cursor-pointer transition-all duration-200 rounded-xl p-4 border-2 bg-gradient-to-br ${colors.bg} ${colors.border} hover:shadow-lg hover:scale-105`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              {bank.logo ? (
                                <img src={bank.logo} alt={bank.name} className="w-12 h-12 rounded-lg object-contain bg-white p-1 shadow-sm" />
                              ) : (
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                  <Building2 className="w-6 h-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 truncate">{bank.name}</h4>
                              <p className="text-sm text-gray-600 font-medium">{bank.code}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                                  {bank.source === 'FLUTTERWAVE' ? 'Flutterwave' : bank.source === 'API' ? 'API' : 'Manuel'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Formulaire de configuration du compte bancaire */}
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {selectedBank.logo ? (
                            <img src={selectedBank.logo} alt={selectedBank.name} className="w-16 h-16 rounded-xl object-contain bg-white p-2 shadow-sm" />
                          ) : (
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <Building2 className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedBank.name}</h3>
                          <p className="text-gray-600">{selectedBank.code}</p>
                          <p className="text-sm text-blue-600 mt-1">
                            Configuration pour {countries.find(c => c.code === selectedCountry)?.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du compte *</label>
                          <input
                            type="text"
                            value={bankAccountForm.accountName}
                            onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountName: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                            placeholder="Ex: GIC Promote LTD"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro de compte *</label>
                          <input
                            type="text"
                            value={bankAccountForm.accountNumber}
                            onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                            placeholder="Ex: 1234567890"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">IBAN (optionnel)</label>
                          <input
                            type="text"
                            value={bankAccountForm.iban}
                            onChange={(e) => setBankAccountForm(prev => ({ ...prev, iban: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                            placeholder="Ex: FR1420041010050500013M02606"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Code SWIFT</label>
                          <input
                            type="text"
                            value={bankAccountForm.swiftCode}
                            onChange={(e) => setBankAccountForm(prev => ({ ...prev, swiftCode: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                            placeholder="Ex: BNPAFRCM"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Routing Number</label>
                          <input
                            type="text"
                            value={bankAccountForm.routingNumber}
                            onChange={(e) => setBankAccountForm(prev => ({ ...prev, routingNumber: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                            placeholder="Ex: 021000021"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Code agence</label>
                          <input
                            type="text"
                            value={bankAccountForm.branchCode}
                            onChange={(e) => setBankAccountForm(prev => ({ ...prev, branchCode: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                            placeholder="Ex: 001"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer du modal */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedBank 
                    ? (editingMethod 
                        ? 'Modifiez les informations du compte bancaire'
                        : 'Configurez les informations du compte bancaire'
                      )
                    : `${getFilteredBanks().length} banque(s) disponible(s)`
                  }
                </div>
                <div className="flex items-center space-x-3">
                  {selectedBank && (
                    <button
                      onClick={() => setSelectedBank(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                      Retour
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowBankModal(false)
                      setSelectedBank(null)
                      setBankAccountForm({
                        accountName: '',
                        accountNumber: '',
                        iban: '',
                        swiftCode: '',
                        routingNumber: '',
                        branchCode: ''
                      })
                      setSearchTerm('')
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  {selectedBank && (
                    <button
                      onClick={associateBank}
                      disabled={!bankAccountForm.accountName || !bankAccountForm.accountNumber || associatingBank}
                      className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#0B3371] to-blue-600 text-white hover:from-[#0B3371]/90 hover:to-blue-500 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-200"
                    >
                      {associatingBank ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                      <span>
                        {associatingBank 
                          ? (editingMethod ? 'Sauvegarde...' : 'Association...') 
                          : (editingMethod ? 'Sauvegarder' : 'Associer la banque')
                        }
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
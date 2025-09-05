'use client'

import { useState, useMemo } from 'react'
import { Eye, DollarSign, X, Filter, Search } from 'lucide-react'
import { formatAmount } from '@/lib/formatters'

interface FlutterwaveBalanceDetailsProps {
  balanceDetails: string | null
  totalBalance: number
  countryCode: string
}

export default function FlutterwaveBalanceDetails({
  balanceDetails,
  totalBalance,
  countryCode
}: FlutterwaveBalanceDetailsProps) {
  const [showModal, setShowModal] = useState(false)
  const [filterByBalance, setFilterByBalance] = useState<'all' | 'positive'>('all')
  const [currencyFilter, setCurrencyFilter] = useState('')

  let balances: any[] = []
  try {
    balances = balanceDetails ? JSON.parse(balanceDetails) : []
  } catch (error) {
    balances = []
  }

  // Filtrer les soldes
  const filteredBalances = useMemo(() => {
    return balances.filter(balance => {
      // Filtre par solde
      if (filterByBalance === 'positive' && balance.availableBalance <= 0) {
        return false
      }
      
      // Filtre par devise
      if (currencyFilter && !balance.currency.toLowerCase().includes(currencyFilter.toLowerCase())) {
        return false
      }
      
      return true
    })
  }, [balances, filterByBalance, currencyFilter])

  // Obtenir la liste unique des devises
  const uniqueCurrencies = useMemo(() => {
    return Array.from(new Set(balances.map(b => b.currency))).sort()
  }, [balances])

  if (balances.length === 0) {
    return (
      <div className="text-right">
        <p className="font-bold text-lg text-[#0B3371]">{formatAmount(totalBalance)}</p>
        <p className="text-xs text-slate-500">{countryCode}</p>
      </div>
    )
  }

  return (
    <>
      <div className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <div>
            <p className="font-bold text-lg text-[#0B3371]">{formatAmount(totalBalance)}</p>
            <p className="text-xs text-slate-500">Total {countryCode}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="p-1 hover:bg-blue-100 rounded transition-colors text-blue-600"
            title="Voir détails par devise"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {balances.length} devises
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] shadow-2xl border border-gray-200 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Soldes Flutterwave</h3>
                    <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">Détails par devise • {balances.length} comptes • {filteredBalances.length} affichés</p>
                    <p className="text-blue-100 text-xs sm:hidden">{balances.length} comptes</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setFilterByBalance('all')
                    setCurrencyFilter('')
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Sidebar avec filtres */}
              <div className="w-full lg:w-80 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 sm:p-6 h-[30%] lg:h-auto overflow-y-auto">
                <div className="space-y-6">
                  {/* Solde total */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-sm text-blue-600 font-semibold mb-1">Solde total converti</p>
                      <p className="text-2xl font-bold text-blue-800">{formatAmount(totalBalance)} {countryCode}</p>
                      <p className="text-xs text-blue-500 mt-1">Converti selon les taux actuels</p>
                    </div>
                  </div>

                  {/* Filtres */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <Filter className="w-4 h-4" />
                      <span>Filtres</span>
                    </div>

                    {/* Filtre par solde */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Par solde</label>
                      <select
                        value={filterByBalance}
                        onChange={(e) => setFilterByBalance(e.target.value as 'all' | 'positive')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="all">Tous les soldes</option>
                        <option value="positive">Soldes &gt; 0 uniquement</option>
                      </select>
                    </div>

                    {/* Filtre par devise */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Par devise</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Rechercher une devise..."
                          value={currencyFilter}
                          onChange={(e) => setCurrencyFilter(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    {/* Liste des devises disponibles */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Devises disponibles</p>
                      <div className="flex flex-wrap gap-1">
                        {uniqueCurrencies.map(currency => (
                          <button
                            key={currency}
                            onClick={() => setCurrencyFilter(currency === currencyFilter ? '' : currency)}
                            className={`px-2 py-1 text-xs rounded-full transition-colors ${
                              currencyFilter === currency
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {currency}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Statistiques</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total comptes:</span>
                        <span className="font-medium">{balances.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Affichés:</span>
                        <span className="font-medium text-blue-600">{filteredBalances.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avec solde &gt; 0:</span>
                        <span className="font-medium text-green-600">
                          {balances.filter(b => b.availableBalance > 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="flex-1 p-4 sm:p-6 h-[70%] lg:h-auto overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Soldes par devise
                    </h4>
                    {filteredBalances.length !== balances.length && (
                      <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {filteredBalances.length} sur {balances.length} affichés
                      </span>
                    )}
                  </div>

                  {filteredBalances.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                      {filteredBalances.map((balance: any, index: number) => {
                        const isPositive = balance.availableBalance > 0
                        const hasLedgerDiff = balance.ledgerBalance !== balance.availableBalance
                        
                        return (
                          <div key={index} className="group relative bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300 overflow-hidden">
                            {/* Background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Status indicator */}
                            <div className={`absolute top-3 sm:top-4 right-3 sm:right-4 w-3 h-3 rounded-full ${
                              isPositive ? 'bg-green-400' : 'bg-gray-300'
                            }`}></div>
                            
                            <div className="relative z-10">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                                    isPositive 
                                      ? 'bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200' 
                                      : 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200'
                                  }`}>
                                    <span className={`font-bold text-xs sm:text-sm ${
                                      isPositive ? 'text-green-700' : 'text-gray-600'
                                    }`}>
                                      {balance.currency}
                                    </span>
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-base sm:text-lg text-gray-900">{balance.currency}</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">Compte Flutterwave</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Balance */}
                              <div className="mb-4">
                                <div className="flex items-baseline space-x-2">
                                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {formatAmount(balance.availableBalance)}
                                  </span>
                                  <span className="text-xs sm:text-sm font-medium text-gray-500">{balance.currency}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Solde disponible</p>
                              </div>
                              
                              {/* Status */}
                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isPositive ? 'bg-green-400' : 'bg-gray-400'
                                  }`}></div>
                                  <span className={`text-xs sm:text-sm font-medium ${
                                    isPositive ? 'text-green-700' : 'text-gray-600'
                                  }`}>
                                    {isPositive ? 'Actif' : 'Vide'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">
                                  #{index + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">Aucun résultat</h4>
                      <p className="text-gray-500">Aucune devise ne correspond à vos critères de filtrage.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex-shrink-0">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Synchronisé en temps réel avec Flutterwave
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
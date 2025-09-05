'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { Plus, Minus, Wallet, RefreshCw } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import ContentLoader from '@/components/ContentLoader'
import { formatAmount } from '@/lib/formatters'
import FlutterwaveBalanceDetails from '@/components/FlutterwaveBalanceDetails'

export default function AdminWalletsPage() {
  const router = useRouter()
  const toast = useToast()
  const [wallets, setWallets] = useState<any[]>([])
  const [selectedWallet, setSelectedWallet] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [operation, setOperation] = useState<'credit' | 'debit'>('credit')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
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
    fetchWallets()
  }, [])

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/wallets', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setWallets(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les portefeuilles')
      setWallets([])
    } finally {
      setLoading(false)
    }
  }

  const handleWalletOperation = async () => {
    if (!selectedWallet || !amount) return

    setActionLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/wallets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subWalletId: selectedWallet.id,
          amount: parseFloat(amount),
          operation
        }),
      })

      if (response.ok) {
        toast.success('Opération réussie', `Portefeuille ${operation === 'credit' ? 'crédité' : 'débité'} avec succès`)
        fetchWallets()
        setSelectedWallet(null)
        setAmount('')
      } else {
        const error = await response.json()
        toast.error('Erreur d\'opération', error.error || 'Impossible de mettre à jour le portefeuille')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setActionLoading(false)
    }
  }





  return (
    <AdminLayout user={user} onLogout={logout}>
      <ContentLoader loading={loading}>
    
        {/* Wallets Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {(wallets || []).length > 0 ? (
            (wallets || []).map((wallet) => (
              <div key={wallet.id} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{wallet.country.name}</h3>
                        <p className="text-white/80 text-sm">{wallet.country.currencyCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-xs uppercase tracking-wide">Solde Total</p>
                      <p className="text-2xl font-bold">{formatAmount(wallet.balance)}</p>
                    </div>
                  </div>
                </div>

                {/* Sub-wallets */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-[#0B3371]">Portefeuilles</h4>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {(wallet.subWallets || []).length} méthodes
                    </span>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/admin/wallets/${wallet.countryId}`)}
                    className="w-full mb-4 py-2 px-4 bg-[#0B3371] hover:bg-[#0B3371]/90 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Voir détails
                  </button>
                  
                  <div className="space-y-3">
                    {(wallet.subWallets || []).map((subWallet: any) => (
                      <div key={subWallet.id} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#F37521]/10 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-[#F37521]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-[#0B3371]">{subWallet.countryPaymentMethod?.paymentMethod?.name || 'N/A'}</p>
                              <p className="text-xs text-slate-500">{subWallet.countryPaymentMethod?.paymentMethod?.type || 'N/A'}</p>
                            </div>
                          </div>
                          {subWallet.countryPaymentMethod?.paymentMethod?.type === 'FLUTTERWAVE' ? (
                            <FlutterwaveBalanceDetails
                              balanceDetails={subWallet.balanceDetails}
                              totalBalance={subWallet.balance}
                              countryCode={wallet.country.currencyCode}
                            />
                          ) : (
                            <div className="text-right">
                              <p className="font-bold text-lg text-[#0B3371]">{formatAmount(subWallet.balance)}</p>
                              <p className="text-xs text-slate-500">{wallet.country.currencyCode}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {subWallet.countryPaymentMethod?.paymentMethod?.type === 'FLUTTERWAVE' ? (
                            <>
                              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                <p className="text-xs text-blue-600 font-medium">🔒 Flutterwave - {wallet.country.name}</p>
                              </div>
                              <button
                                onClick={async () => {
                                  setSyncLoading(true)
                                  try {
                                    const token = localStorage.getItem('adminToken')
                                    const response = await fetch(`/api/admin/wallets/sync-flutterwave/${wallet.countryId}`, {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    })
                                    
                                    if (response.ok) {
                                      const result = await response.json()
                                      toast.success('Synchronisation réussie', result.message)
                                      fetchWallets()
                                    } else {
                                      const error = await response.json()
                                      toast.error('Erreur de synchronisation', error.error)
                                    }
                                  } catch (error) {
                                    toast.error('Erreur de connexion', 'Impossible de synchroniser le solde')
                                  } finally {
                                    setSyncLoading(false)
                                  }
                                }}
                                disabled={syncLoading}
                                className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                                <span>Sync</span>
                              </button>
                            </>
                          ) : subWallet.countryPaymentMethod?.paymentMethod?.type === 'CINETPAY' ? (
                            <>
                              <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                                <p className="text-xs text-orange-600 font-medium">🔒 CinetPay - {wallet.country.name}</p>
                              </div>
                              <button
                                onClick={async () => {
                                  setSyncLoading(true)
                                  try {
                                    const token = localStorage.getItem('adminToken')
                                    const response = await fetch(`/api/admin/wallets/sync-cinetpay/${wallet.countryId}`, {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    })
                                    
                                    if (response.ok) {
                                      const result = await response.json()
                                      toast.success('Synchronisation réussie', result.message)
                                      fetchWallets()
                                    } else {
                                      const error = await response.json()
                                      toast.error('Erreur de synchronisation', error.error)
                                    }
                                  } catch (error) {
                                    toast.error('Erreur de connexion', 'Impossible de synchroniser le solde')
                                  } finally {
                                    setSyncLoading(false)
                                  }
                                }}
                                disabled={syncLoading}
                                className="flex items-center space-x-2 px-3 py-2 bg-[#F37521] hover:bg-[#F37521]/90 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                                <span>Sync</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedWallet(subWallet)
                                  setOperation('credit')
                                }}
                                className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm font-medium"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Créditer</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedWallet(subWallet)
                                  setOperation('debit')
                                }}
                                className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm font-medium"
                              >
                                <Minus className="w-4 h-4" />
                                <span>Débiter</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-16 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0B3371]/10 to-[#F37521]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-[#0B3371] mb-3">Aucun portefeuille disponible</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">Les portefeuilles seront créés automatiquement lors de la première transaction pour chaque pays et méthode de paiement.</p>
                <div className="inline-flex items-center space-x-2 text-sm text-[#F37521]">
                  <div className="w-2 h-2 bg-[#F37521] rounded-full animate-pulse"></div>
                  <span>En attente de transactions...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Operation Modal */}
        {selectedWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                {operation === 'credit' ? 'Créditer' : 'Débiter'} le wallet
              </h2>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">Wallet sélectionné</p>
                <p className="font-medium">{selectedWallet.countryPaymentMethod?.paymentMethod?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">
                  Solde actuel: {formatAmount(selectedWallet.balance)} {selectedWallet.wallet?.country?.currencyCode}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Montant à {operation === 'credit' ? 'créditer' : 'débiter'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleWalletOperation}
                  disabled={actionLoading || !amount}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                    operation === 'credit'
                      ? 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                      : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <span>{operation === 'credit' ? 'Créditer' : 'Débiter'}</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedWallet(null)
                    setAmount('')
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </ContentLoader>
    </AdminLayout>
  )
}
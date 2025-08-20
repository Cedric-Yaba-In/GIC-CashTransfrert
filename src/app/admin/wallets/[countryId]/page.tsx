'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { ArrowLeft, Plus, Minus, Wallet, CreditCard, RefreshCw } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import ContentLoader from '@/components/ContentLoader'
import { formatAmount } from '@/lib/formatters'

export default function WalletDetailPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const [wallet, setWallet] = useState<any>(null)
  const [selectedSubWallet, setSelectedSubWallet] = useState<any>(null)
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
    fetchWallet()
  }, [params.countryId])

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/wallets/${params.countryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setWallet(data)
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger le portefeuille')
    } finally {
      setLoading(false)
    }
  }

  const handleSubWalletOperation = async () => {
    if (!selectedSubWallet || !amount) return

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
          subWalletId: selectedSubWallet.id,
          amount: parseFloat(amount),
          operation
        }),
      })

      if (response.ok) {
        toast.success('Opération réussie', `Sous-portefeuille ${operation === 'credit' ? 'crédité' : 'débité'} avec succès`)
        fetchWallet()
        setSelectedSubWallet(null)
        setAmount('')
      } else {
        const error = await response.json()
        toast.error('Erreur d\'opération', error.error || 'Impossible de mettre à jour le sous-portefeuille')
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
        {wallet && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/wallets')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#0B3371]">Portefeuille {wallet.country?.name || 'Inconnu'}</h1>
                <p className="text-gray-600">Gestion des sous-portefeuilles par méthode de paiement</p>
              </div>
            </div>

            {/* Wallet Summary */}
            <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{wallet.country?.name || 'Inconnu'}</h2>
                    <p className="text-white/80">{wallet.country?.currency || 'N/A'} ({wallet.country?.currencyCode || 'N/A'})</p>
                    <p className="text-white/60 text-sm">Code pays: {wallet.country?.code || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm uppercase tracking-wide">Solde Total</p>
                  <p className="text-4xl font-bold">{formatAmount(wallet.balance)}</p>
                  <p className="text-white/80">{wallet.country?.currencyCode || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Sub-wallets */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#0B3371]/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#0B3371]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0B3371]">Méthodes de paiement</h3>
                      <p className="text-sm text-slate-600">Gestion des soldes par méthode</p>
                    </div>
                  </div>
                  <span className="bg-[#F37521]/10 text-[#F37521] px-3 py-1 rounded-full text-sm font-medium">
                    {wallet.subWallets?.length || 0} configurées
                  </span>
                </div>
              </div>

              <div className="p-6 bg-slate-50">
                {(wallet.subWallets?.length || 0) > 0 ? (
                  <div className="space-y-4">
                    {(wallet.subWallets || []).map((subWallet: any) => (
                      <div key={subWallet.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-[#F37521]/10 rounded-xl flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-[#F37521]" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-1">
                                <h4 className="text-lg font-bold text-[#0B3371]">
                                  {subWallet.countryPaymentMethod?.paymentMethod?.name || 'N/A'}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  subWallet.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {subWallet.active ? 'Actif' : 'Inactif'}
                                </span>
                              </div>
                              <p className="text-slate-600 mb-2">
                                {subWallet.countryPaymentMethod?.paymentMethod?.type || 'N/A'}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-slate-500">
                                <span>Min: {subWallet.countryPaymentMethod?.minAmount ? formatAmount(subWallet.countryPaymentMethod.minAmount) : 'N/A'}</span>
                                <span>Max: {subWallet.countryPaymentMethod?.maxAmount ? formatAmount(subWallet.countryPaymentMethod.maxAmount) : 'N/A'}</span>
                                <span>Frais: {subWallet.countryPaymentMethod?.fees || 0}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-[#0B3371]">{formatAmount(subWallet.balance)}</p>
                              <p className="text-slate-500">{wallet.country?.currencyCode || 'N/A'}</p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {subWallet.countryPaymentMethod?.paymentMethod?.type === 'FLUTTERWAVE' ? (
                                <button
                                  onClick={async () => {
                                    setSyncLoading(true)
                                    try {
                                      const token = localStorage.getItem('adminToken')
                                      const response = await fetch(`/api/admin/wallets/sync-flutterwave/${wallet.country?.id || wallet.countryId}`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      })
                                      
                                      if (response.ok) {
                                        const result = await response.json()
                                        toast.success('Synchronisation réussie', `Solde Flutterwave synchronisé pour ${result.country}`)
                                        fetchWallet()
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
                                  title={`Synchroniser Flutterwave - ${wallet.country?.name || 'Pays'}`}
                                >
                                  <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                                  <span>Sync</span>
                                </button>
                              ) : subWallet.countryPaymentMethod?.paymentMethod?.type === 'CINETPAY' ? (
                                <button
                                  onClick={async () => {
                                    setSyncLoading(true)
                                    try {
                                      const token = localStorage.getItem('adminToken')
                                      const response = await fetch(`/api/admin/wallets/sync-cinetpay/${wallet.country?.id || wallet.countryId}`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      })
                                      
                                      if (response.ok) {
                                        const result = await response.json()
                                        toast.success('Synchronisation réussie', `Solde CinetPay synchronisé pour ${result.country}`)
                                        fetchWallet()
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
                                  title={`Synchroniser CinetPay - ${wallet.country?.name || 'Pays'}`}
                                >
                                  <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                                  <span>Sync</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedSubWallet(subWallet)
                                      setOperation('credit')
                                    }}
                                    className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors group"
                                    title="Créditer"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedSubWallet(subWallet)
                                      setOperation('debit')
                                    }}
                                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors group"
                                    title="Débiter"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-600 mb-2">Aucun sous-portefeuille</h4>
                    <p className="text-slate-500">
                      Les sous-portefeuilles seront créés automatiquement lors de l'association de méthodes de paiement à ce pays.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Operation Modal */}
        {selectedSubWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4 text-[#0B3371]">
                {operation === 'credit' ? 'Créditer' : 'Débiter'} le sous-portefeuille
              </h2>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-600 mb-1">Méthode de paiement</p>
                <p className="font-semibold text-[#0B3371]">
                  {selectedSubWallet.countryPaymentMethod?.paymentMethod?.name || 'N/A'}
                </p>
                <p className="text-sm text-slate-500 mb-2">
                  {selectedSubWallet.countryPaymentMethod?.paymentMethod?.type || 'N/A'}
                </p>
                <p className="text-sm text-slate-600">
                  Solde actuel: <span className="font-semibold">{formatAmount(selectedSubWallet.balance)} {wallet.country?.currencyCode || ''}</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-[#0B3371]">
                  Montant à {operation === 'credit' ? 'créditer' : 'débiter'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B3371] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubWalletOperation}
                  disabled={actionLoading || !amount}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
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
                    <>
                      {operation === 'credit' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                      <span>{operation === 'credit' ? 'Créditer' : 'Débiter'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedSubWallet(null)
                    setAmount('')
                  }}
                  className="flex-1 py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
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
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { Check, X, Eye } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import ContentLoader from '@/components/ContentLoader'

export default function AdminTransactionsPage() {
  const router = useRouter()
  const toast = useToast()
  const [transactions, setTransactions] = useState<any[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
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
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      const data = await response.json()
      setTransactions(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les transactions')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (transactionId: string, status: string, notes?: string) => {
    setActionLoading(transactionId)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, adminNotes: notes }),
      })

      if (response.ok) {
        toast.success('Action réussie', `Transaction ${status === 'APPROVED' ? 'approuvée' : 'rejetée'} avec succès`)
        fetchTransactions()
        setSelectedTransaction(null)
      } else {
        toast.error('Erreur de mise à jour', 'Impossible de mettre à jour la transaction')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PAID': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }



  return (
    <AdminLayout user={user} onLogout={logout}>
      <ContentLoader loading={loading}>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <select className="input max-w-xs">
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="PAID">Payées</option>
              <option value="APPROVED">Approuvées</option>
              <option value="COMPLETED">Complétées</option>
              <option value="REJECTED">Rejetées</option>
              <option value="CANCELLED">Annulées</option>
              <option value="FAILED">Échouées</option>
            </select>
            <input 
              type="text" 
              placeholder="Rechercher par référence..." 
              className="input max-w-xs"
            />
          </div>
        </div>

        {/* Transactions Cards */}
        <div className="space-y-4">
          {(transactions || []).length > 0 ? (
            (transactions || []).map((transaction) => (
              <div key={transaction.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#0B3371]/10 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#0B3371]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#0B3371]">{transaction.reference}</h3>
                        <p className="text-sm text-slate-500">{new Date(transaction.createdAt).toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        transaction.status === 'PENDING' ? 'bg-orange-100 text-[#F37521] border border-orange-200' :
                        transaction.status === 'PAID' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        transaction.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' :
                        transaction.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        transaction.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                        transaction.status === 'FAILED' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Expéditeur</h4>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="font-semibold text-[#0B3371]">{transaction.senderName}</p>
                        <p className="text-sm text-slate-600">{transaction.senderCountry?.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{transaction.senderEmail}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Destinataire</h4>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="font-semibold text-[#0B3371]">{transaction.receiverName}</p>
                        <p className="text-sm text-slate-600">{transaction.receiverCountry?.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{transaction.receiverEmail || 'Non fourni'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Montant</h4>
                      <div className="bg-[#F37521]/10 rounded-xl p-4 border border-[#F37521]/20">
                        <p className="text-2xl font-bold text-[#F37521]">{transaction.amount}</p>
                        <p className="text-sm text-slate-600">{transaction.senderCountry?.currencyCode}</p>
                        <p className="text-xs text-slate-500 mt-1">Frais: {transaction.fees || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#F37521] rounded-full"></div>
                      <span className="text-sm text-slate-600">Méthode: {transaction.paymentMethod?.name || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium">Détails</span>
                      </button>
                      
                      {transaction.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAction(transaction.id, 'APPROVED')}
                            disabled={actionLoading === transaction.id}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {actionLoading === transaction.id ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">
                              {actionLoading === transaction.id ? 'Traitement...' : 'Approuver'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleAction(transaction.id, 'REJECTED')}
                            disabled={actionLoading === transaction.id}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {actionLoading === transaction.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">
                              {actionLoading === transaction.id ? 'Traitement...' : 'Rejeter'}
                            </span>
                          </button>
                        </div>
                      )}
                      
                      {transaction.status === 'PAID' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAction(transaction.id, 'APPROVED')}
                            disabled={actionLoading === transaction.id}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {actionLoading === transaction.id ? (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">
                              {actionLoading === transaction.id ? 'Traitement...' : 'Traiter le transfert'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#0B3371]/10 to-[#F37521]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#0B3371] mb-3">Aucune transaction trouvée</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">Les transactions apparaîtront ici une fois que les utilisateurs commenceront à effectuer des transferts d'argent.</p>
              <div className="inline-flex items-center space-x-2 text-sm text-[#F37521]">
                <div className="w-2 h-2 bg-[#F37521] rounded-full animate-pulse"></div>
                <span>En attente de nouvelles transactions...</span>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0B3371] to-[#1e4a7a] px-8 py-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Détails de la transaction</h2>
                      <p className="text-blue-100 text-sm">{selectedTransaction.reference}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Status Badge */}
                <div className="flex justify-center mb-8">
                  <span className={`px-6 py-3 rounded-2xl text-lg font-bold border-2 ${
                    selectedTransaction.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    selectedTransaction.status === 'PAID' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    selectedTransaction.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                    selectedTransaction.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedTransaction.status === 'CANCELLED' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                    selectedTransaction.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {selectedTransaction.status === 'PENDING' ? '⏳ En attente' :
                     selectedTransaction.status === 'PAID' ? '💳 Payée' :
                     selectedTransaction.status === 'APPROVED' ? '✅ Approuvée' :
                     selectedTransaction.status === 'COMPLETED' ? '✨ Complétée' :
                     selectedTransaction.status === 'CANCELLED' ? '🚫 Annulée' :
                     selectedTransaction.status === 'FAILED' ? '❌ Échouée' : '❌ Rejetée'}
                  </span>
                </div>

                {/* Main Info Cards */}
                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                  {/* Amount Card */}
                  <div className="bg-gradient-to-br from-[#F37521]/10 to-[#F37521]/5 rounded-2xl p-6 border border-[#F37521]/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-[#F37521] text-lg">Montant</h3>
                      <div className="w-10 h-10 bg-[#F37521]/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#F37521]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant:</span>
                        <span className="font-bold text-gray-900">{selectedTransaction.amount} {selectedTransaction.senderCountry?.currencyCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frais:</span>
                        <span className="font-semibold text-red-600">+{selectedTransaction.fees} {selectedTransaction.senderCountry?.currencyCode}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-[#F37521]">Total:</span>
                          <span className="font-bold text-xl text-[#F37521]">{selectedTransaction.totalAmount} {selectedTransaction.senderCountry?.currencyCode}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sender Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-25 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-blue-700 text-lg">Expéditeur</h3>
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Nom complet</p>
                        <p className="font-bold text-gray-900">{selectedTransaction.senderName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                        <p className="text-sm text-gray-700">{selectedTransaction.senderEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Téléphone</p>
                        <p className="text-sm text-gray-700">{selectedTransaction.senderPhone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Pays</p>
                        <p className="font-semibold text-blue-700">{selectedTransaction.senderCountry?.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Receiver Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-25 rounded-2xl p-6 border border-green-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-green-700 text-lg">Destinataire</h3>
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Nom complet</p>
                        <p className="font-bold text-gray-900">{selectedTransaction.receiverName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                        <p className="text-sm text-gray-700">{selectedTransaction.receiverEmail || 'Non fourni'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Téléphone</p>
                        <p className="text-sm text-gray-700">{selectedTransaction.receiverPhone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Pays</p>
                        <p className="font-semibold text-green-700">{selectedTransaction.receiverCountry?.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Informations techniques
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Méthode de paiement:</span>
                        <span className="font-semibold">{selectedTransaction.paymentMethod?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Créé le:</span>
                        <span className="font-mono text-sm">{new Date(selectedTransaction.createdAt).toLocaleString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modifié le:</span>
                        <span className="font-mono text-sm">{new Date(selectedTransaction.updatedAt).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-6">
                    <h3 className="font-bold text-purple-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Suivi de la transaction
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Transaction créée</span>
                      </div>
                      <div className={`flex items-center space-x-3 ${
                        selectedTransaction.status === 'PENDING' ? 'opacity-50' : ''
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          selectedTransaction.status !== 'PENDING' ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <span className="text-sm">Transaction traitée</span>
                      </div>
                      <div className="flex items-center space-x-3 opacity-50">
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <span className="text-sm">Fonds transférés</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error/Cancellation Info */}
                {(selectedTransaction.status === 'CANCELLED' || selectedTransaction.status === 'FAILED') && selectedTransaction.adminNotes && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                    <h3 className="font-bold text-red-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      {selectedTransaction.status === 'CANCELLED' ? 'Informations d\'annulation' : 'Informations d\'erreur'}
                    </h3>
                    <div className="bg-red-100 p-4 rounded-xl">
                      {(() => {
                        try {
                          const notes = JSON.parse(selectedTransaction.adminNotes)
                          return (
                            <div className="space-y-3">
                              {notes.failureReason && (
                                <div>
                                  <span className="font-medium text-red-800">Raison:</span>
                                  <p className="text-red-700 mt-1">{notes.failureReason}</p>
                                </div>
                              )}
                              {notes.paymentStatus && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-red-800">Statut du paiement:</span>
                                  <span className="text-red-700">{notes.paymentStatus}</span>
                                </div>
                              )}
                              {notes.flutterwaveTransactionId && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-red-800">ID Flutterwave:</span>
                                  <span className="text-red-700 font-mono text-sm">{notes.flutterwaveTransactionId}</span>
                                </div>
                              )}
                              {notes.ipWhitelistingError && (
                                <div className="bg-red-200 p-3 rounded-lg">
                                  <p className="text-red-800 font-medium">⚠️ Erreur IP Whitelisting</p>
                                  <p className="text-red-700 text-sm mt-1">Cette transaction nécessite un traitement manuel en raison des restrictions IP de Flutterwave.</p>
                                </div>
                              )}
                            </div>
                          )
                        } catch (error) {
                          return <p className="text-red-800">{selectedTransaction.adminNotes}</p>
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Payment Status Info for PAID transactions */}
                {selectedTransaction.status === 'PAID' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Paiement confirmé - En attente de traitement
                    </h3>
                    <div className="bg-blue-100 p-4 rounded-xl">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-blue-800 font-medium">L'expéditeur a effectué le paiement avec succès</span>
                      </div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-blue-800">En attente d'approbation pour le transfert vers le destinataire</span>
                      </div>
                      {selectedTransaction.paidAt && (
                        <div className="text-sm text-blue-700 mt-3">
                          <strong>Payé le :</strong> {new Date(selectedTransaction.paidAt).toLocaleString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTransaction.adminNotes && (selectedTransaction.status === 'PENDING' || selectedTransaction.status === 'PAID' || selectedTransaction.status === 'APPROVED' || selectedTransaction.status === 'COMPLETED') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                    <h3 className="font-bold text-yellow-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Informations de paiement
                    </h3>
                    <div className="bg-yellow-100 p-4 rounded-xl">
                      {(() => {
                        try {
                          const notes = JSON.parse(selectedTransaction.adminNotes)
                          return (
                            <div className="space-y-3">
                              {(notes.automaticTransferError || notes.criticalTransferError || notes.requiresManualTransfer) && (
                                <div className="bg-orange-100 border border-orange-200 p-3 rounded-lg mb-3">
                                  <p className="text-orange-800 font-medium">⚠️ Attention - Traitement manuel requis</p>
                                  {notes.automaticTransferError && (
                                    <p className="text-orange-700 text-sm mt-1">Erreur: {notes.automaticTransferError}</p>
                                  )}
                                  {notes.criticalTransferError && (
                                    <p className="text-orange-700 text-sm mt-1">Erreur critique: {notes.criticalTransferError}</p>
                                  )}
                                </div>
                              )}
                              {notes.receiverPaymentMethod && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-yellow-800">Méthode de réception:</span>
                                  <span className="text-yellow-700">{notes.receiverPaymentMethod}</span>
                                </div>
                              )}
                              {notes.flutterwaveOption && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-yellow-800">Option Flutterwave:</span>
                                  <span className="text-yellow-700">
                                    {notes.flutterwaveOption === 'mobilemoney' ? 'Mobile Money' :
                                     notes.flutterwaveOption === 'card' ? 'Carte bancaire' :
                                     notes.flutterwaveOption === 'banktransfer' ? 'Virement bancaire' :
                                     notes.flutterwaveOption}
                                  </span>
                                </div>
                              )}
                              {notes.receiverPaymentInfo && (
                                <div className="border-t border-yellow-200 pt-3">
                                  <p className="font-medium text-yellow-800 mb-2">Informations du destinataire:</p>
                                  <div className="space-y-2 ml-4">
                                    {notes.receiverPaymentInfo.accountName && (
                                      <div className="flex justify-between">
                                        <span className="text-yellow-700">Nom du compte:</span>
                                        <span className="font-medium text-yellow-800">{notes.receiverPaymentInfo.accountName}</span>
                                      </div>
                                    )}
                                    {notes.receiverPaymentInfo.mobileNumber && (
                                      <div className="flex justify-between">
                                        <span className="text-yellow-700">Numéro mobile:</span>
                                        <span className="font-medium text-yellow-800">{notes.receiverPaymentInfo.mobileNumber}</span>
                                      </div>
                                    )}
                                    {notes.receiverPaymentInfo.bankAccount && (
                                      <div className="flex justify-between">
                                        <span className="text-yellow-700">Compte bancaire:</span>
                                        <span className="font-medium text-yellow-800">{notes.receiverPaymentInfo.bankAccount}</span>
                                      </div>
                                    )}
                                    {notes.receiverPaymentInfo.bankCode && (
                                      <div className="flex justify-between">
                                        <span className="text-yellow-700">Code banque:</span>
                                        <span className="font-medium text-yellow-800">{notes.receiverPaymentInfo.bankCode}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        } catch (error) {
                          return <p className="text-yellow-800">{selectedTransaction.adminNotes}</p>
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedTransaction.status === 'PENDING' && (
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleAction(selectedTransaction.id, 'APPROVED')}
                      disabled={actionLoading === selectedTransaction.id}
                      className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-2xl flex items-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {actionLoading === selectedTransaction.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      ) : (
                        <Check className="h-5 w-5 mr-3" />
                      )}
                      {actionLoading === selectedTransaction.id ? 'Traitement...' : 'Approuver la transaction'}
                    </button>
                    <button
                      onClick={() => handleAction(selectedTransaction.id, 'REJECTED')}
                      disabled={actionLoading === selectedTransaction.id}
                      className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl flex items-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {actionLoading === selectedTransaction.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      ) : (
                        <X className="h-5 w-5 mr-3" />
                      )}
                      {actionLoading === selectedTransaction.id ? 'Traitement...' : 'Rejeter la transaction'}
                    </button>
                  </div>
                )}
                
                {selectedTransaction.status === 'PAID' && (
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleAction(selectedTransaction.id, 'APPROVED')}
                      disabled={actionLoading === selectedTransaction.id}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl flex items-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {actionLoading === selectedTransaction.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      ) : (
                        <Check className="h-5 w-5 mr-3" />
                      )}
                      {actionLoading === selectedTransaction.id ? 'Traitement...' : 'Traiter le transfert vers le destinataire'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </ContentLoader>
    </AdminLayout>
  )
}
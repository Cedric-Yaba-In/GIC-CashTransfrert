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
              <option value="APPROVED">Approuvées</option>
              <option value="REJECTED">Rejetées</option>
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
                        transaction.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' :
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Détails de la transaction</h2>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-3">Informations générales</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Référence:</span> {selectedTransaction.reference}</p>
                      <p><span className="font-medium">Montant:</span> {selectedTransaction.amount} {selectedTransaction.senderCountry?.currencyCode}</p>
                      <p><span className="font-medium">Frais:</span> {selectedTransaction.fees} {selectedTransaction.senderCountry?.currencyCode}</p>
                      <p><span className="font-medium">Total:</span> {selectedTransaction.totalAmount} {selectedTransaction.senderCountry?.currencyCode}</p>
                      <p><span className="font-medium">Méthode:</span> {selectedTransaction.paymentMethod?.name}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Expéditeur</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Nom:</span> {selectedTransaction.senderName}</p>
                      <p><span className="font-medium">Email:</span> {selectedTransaction.senderEmail}</p>
                      <p><span className="font-medium">Téléphone:</span> {selectedTransaction.senderPhone}</p>
                      <p><span className="font-medium">Pays:</span> {selectedTransaction.senderCountry?.name}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Destinataire</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Nom:</span> {selectedTransaction.receiverName}</p>
                      <p><span className="font-medium">Email:</span> {selectedTransaction.receiverEmail || 'Non fourni'}</p>
                      <p><span className="font-medium">Téléphone:</span> {selectedTransaction.receiverPhone}</p>
                      <p><span className="font-medium">Pays:</span> {selectedTransaction.receiverCountry?.name}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Statut</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                          {selectedTransaction.status}
                        </span>
                      </p>
                      <p><span className="font-medium">Créé le:</span> {new Date(selectedTransaction.createdAt).toLocaleString('fr-FR')}</p>
                      <p><span className="font-medium">Modifié le:</span> {new Date(selectedTransaction.updatedAt).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                </div>

                {selectedTransaction.adminNotes && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Notes administrateur</h3>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedTransaction.adminNotes}</p>
                  </div>
                )}

                {selectedTransaction.status === 'PENDING' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAction(selectedTransaction.id, 'APPROVED')}
                      disabled={actionLoading === selectedTransaction.id}
                      className="btn-primary flex items-center"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approuver
                    </button>
                    <button
                      onClick={() => handleAction(selectedTransaction.id, 'REJECTED')}
                      disabled={actionLoading === selectedTransaction.id}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeter
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
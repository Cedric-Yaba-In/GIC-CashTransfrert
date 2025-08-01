'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Check, X, Eye, ArrowLeft } from 'lucide-react'

export default function AdminTransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      setTransactions(data)
    } catch (error) {
      toast.error('Erreur lors du chargement')
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
        toast.success(`Transaction ${status === 'APPROVED' ? 'approuvée' : 'rejetée'}`)
        fetchTransactions()
        setSelectedTransaction(null)
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="GIC Logo" width={32} height={32} />
              <div>
                <h1 className="font-bold text-lg">Gestion des Transactions</h1>
                <p className="text-sm text-gray-600">Administration</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/admin')}
              className="flex items-center text-gray-600 hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour au dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
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

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expéditeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinataire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p className="font-medium">{transaction.senderName}</p>
                        <p className="text-xs text-gray-400">{transaction.senderCountry?.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p className="font-medium">{transaction.receiverName}</p>
                        <p className="text-xs text-gray-400">{transaction.receiverCountry?.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.amount} {transaction.senderCountry?.currencyCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {transaction.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(transaction.id, 'APPROVED')}
                              disabled={actionLoading === transaction.id}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAction(transaction.id, 'REJECTED')}
                              disabled={actionLoading === transaction.id}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      </div>
    </div>
  )
}
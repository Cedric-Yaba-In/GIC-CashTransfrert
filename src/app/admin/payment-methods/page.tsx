'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { Plus, CreditCard, Settings, ToggleLeft, ToggleRight, Edit, Trash2, X } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import ContentLoader from '@/components/ContentLoader'

interface PaymentMethod {
  id: number
  name: string
  type: string
  minAmount: number
  maxAmount: number | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminPaymentMethodsPage() {
  const router = useRouter()
  const toast = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [editForm, setEditForm] = useState({ name: '', minAmount: 0, maxAmount: null as number | null })
  const [updating, setUpdating] = useState(false)
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
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods')
      const data = await response.json()
      setPaymentMethods(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les méthodes de paiement')
      setPaymentMethods([])
    } finally {
      setLoading(false)
    }
  }

  const toggleMethodStatus = async (methodId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/payment-methods/${methodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (response.ok) {
        toast.success('Statut mis à jour', `La méthode a été ${!currentStatus ? 'activée' : 'désactivée'}`)
        fetchPaymentMethods()
      } else {
        toast.error('Erreur de mise à jour', 'Impossible de modifier le statut')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    }
  }

  const openEditModal = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setEditForm({
      name: method.name,
      minAmount: method.minAmount,
      maxAmount: method.maxAmount
    })
    setShowEditModal(true)
  }

  const updatePaymentMethod = async () => {
    if (!selectedMethod) return
    
    setUpdating(true)
    try {
      const response = await fetch(`/api/payment-methods/${selectedMethod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        toast.success('Méthode mise à jour', 'Les modifications ont été enregistrées')
        fetchPaymentMethods()
        setShowEditModal(false)
        setSelectedMethod(null)
      } else {
        toast.error('Erreur de mise à jour', 'Impossible de modifier la méthode')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setUpdating(false)
    }
  }

  const getStats = () => {
    const total = paymentMethods.length
    const active = paymentMethods.filter(m => m.active).length
    const inactive = total - active
    
    return { total, active, inactive }
  }

  const stats = getStats()

  return (
    <AdminLayout user={user} onLogout={logout}>
      <ContentLoader loading={loading}>
        {/* Statistiques */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total Méthodes</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <CreditCard className="w-8 h-8" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Actives</p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <ToggleRight className="w-8 h-8" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Inactives</p>
                  <p className="text-3xl font-bold">{stats.inactive}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <ToggleLeft className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des méthodes de paiement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <div key={method.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#F37521]/10 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-[#F37521]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#0B3371]">{method.name}</h3>
                        <p className="text-gray-600 text-sm">{method.type}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleMethodStatus(method.id, method.active)}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      title={method.active ? 'Désactiver' : 'Activer'}
                    >
                      {method.active ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    method.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {method.active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>

                {/* Informations */}
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-[#0B3371] mb-3">Limites de montant</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Minimum</p>
                          <p className="font-bold text-[#0B3371]">{method.minAmount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Maximum</p>
                          <p className="font-bold text-[#F37521]">{method.maxAmount || '∞'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-[#0B3371] mb-2">Informations</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Créée le: {new Date(method.createdAt).toLocaleDateString('fr-FR')}</p>
                        <p>Modifiée le: {new Date(method.updatedAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => openEditModal(method)}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#0B3371] hover:bg-[#0B3371]/90 text-white rounded-xl transition-colors font-medium text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-16 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0B3371]/10 to-[#F37521]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-[#0B3371] mb-3">Aucune méthode de paiement</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Créez votre première méthode de paiement pour commencer à accepter les transactions.
                </p>
                <button className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#F37521] to-[#F37521]/80 hover:from-[#F37521]/90 hover:to-[#F37521]/70 text-white rounded-xl font-semibold transition-all duration-200">
                  <Plus className="w-5 h-5" />
                  <span>Créer une méthode</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de modification */}
        {showEditModal && selectedMethod && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Modifier {selectedMethod.name}</h2>
                    <p className="text-white/80 text-sm">Ajustez les paramètres de cette méthode</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedMethod(null)
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom de la méthode
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent transition-all"
                      placeholder="Nom de la méthode"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Montant minimum
                      </label>
                      <input
                        type="number"
                        value={editForm.minAmount}
                        onChange={(e) => setEditForm({ ...editForm, minAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent transition-all"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Montant maximum
                      </label>
                      <input
                        type="number"
                        value={editForm.maxAmount || ''}
                        onChange={(e) => setEditForm({ ...editForm, maxAmount: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3371] focus:border-transparent transition-all"
                        placeholder="Illimité"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Le type de méthode ({selectedMethod.type}) ne peut pas être modifié car il est lié au code de l'application.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedMethod(null)
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={updatePaymentMethod}
                    disabled={updating}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 hover:from-[#0B3371]/90 hover:to-[#0B3371]/70 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Edit className="w-4 h-4" />
                    )}
                    <span>{updating ? 'Enregistrement...' : 'Enregistrer'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ContentLoader>
    </AdminLayout>
  )
}
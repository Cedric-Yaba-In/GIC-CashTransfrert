'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { MessageCircle, Send, User, Bot, Clock, AlertCircle, CheckCircle, X, Eye } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import ContentLoader from '@/components/ContentLoader'

export default function AdminTicketsPage() {
  const router = useRouter()
  const toast = useToast()
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
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
    fetchTickets()
  }, [filterStatus])

  const fetchTickets = async () => {
    try {
      const url = filterStatus ? `/api/admin/tickets?status=${filterStatus}` : '/api/admin/tickets'
      const response = await fetch(url)
      const data = await response.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement', 'Impossible de charger les tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketDetails = async (ticketId: number) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`)
      const data = await response.json()
      if (response.ok) {
        setSelectedTicket(data)
      } else {
        toast.error('Erreur', 'Impossible de charger les détails du ticket')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de charger les détails')
    }
  }

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return

    setActionLoading('reply')
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyMessage,
          status: 'IN_PROGRESS'
        })
      })

      if (response.ok) {
        toast.success('Réponse envoyée', 'Votre message a été envoyé au client')
        setReplyMessage('')
        fetchTicketDetails(selectedTicket.id)
        fetchTickets()
      } else {
        toast.error('Erreur', 'Impossible d\'envoyer la réponse')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible d\'envoyer la réponse')
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = async (ticketId: number, status: string) => {
    setActionLoading(ticketId.toString())
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId, status })
      })

      if (response.ok) {
        toast.success('Statut mis à jour', `Ticket marqué comme ${status.toLowerCase()}`)
        fetchTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status })
        }
      } else {
        toast.error('Erreur', 'Impossible de mettre à jour le statut')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de mettre à jour le statut')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'RESOLVED': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'NORMAL': return 'bg-blue-100 text-blue-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminLayout user={user} onLogout={logout}>
      <ContentLoader loading={loading}>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input max-w-xs"
            >
              <option value="">Tous les statuts</option>
              <option value="OPEN">Ouverts</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="RESOLVED">Résolus</option>
              <option value="CLOSED">Fermés</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">#{ticket.id} - {ticket.subject}</h3>
                        <p className="text-sm text-gray-500">
                          {ticket.transaction ? `Transaction: ${ticket.transaction.reference}` : 'Ticket général'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Client</h4>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="font-semibold text-gray-900">{ticket.transaction?.senderName || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{ticket.transaction?.senderEmail || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Dernière activité</h4>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600">
                          {new Date(ticket.updatedAt).toLocaleString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ticket._count.messages} message(s)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Créé le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => fetchTicketDetails(ticket.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium">Voir détails</span>
                      </button>
                      
                      {ticket.status === 'OPEN' && (
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'RESOLVED')}
                          disabled={actionLoading === ticket.id.toString()}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Résoudre</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Aucun ticket trouvé</h3>
              <p className="text-gray-500">Les tickets de support apparaîtront ici.</p>
            </div>
          )}
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Ticket #{selectedTicket.id}</h2>
                    <p className="text-blue-100">{selectedTicket.subject}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Transaction Info */}
                {selectedTicket.transaction && (
                  <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Transaction associée</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Référence</p>
                        <p className="font-semibold">{selectedTicket.transaction.reference}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Montant</p>
                        <p className="font-semibold">{selectedTicket.transaction.amount} {selectedTicket.transaction.senderCountry?.currencyCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Expéditeur</p>
                        <p className="font-semibold">{selectedTicket.transaction.senderName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Statut</p>
                        <p className="font-semibold">{selectedTicket.transaction.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <h3 className="font-bold text-gray-900 mb-4">Conversation</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedTicket.messages?.map((message: any, index: number) => (
                      <div
                        key={index}
                        className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.isAdmin
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 shadow-sm border'
                        }`}>
                          <div className="flex items-center space-x-2 mb-1">
                            {message.isAdmin ? (
                              <Bot className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                            <span className="text-xs font-medium">
                              {message.isAdmin ? (message.admin?.name || 'Support') : 'Client'}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-2 ${
                            message.isAdmin ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Répondre au client
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Tapez votre réponse..."
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      {selectedTicket.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleStatusChange(selectedTicket.id, 'RESOLVED')}
                          disabled={actionLoading === selectedTicket.id.toString()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          Marquer résolu
                        </button>
                      )}
                      {selectedTicket.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleStatusChange(selectedTicket.id, 'CLOSED')}
                          disabled={actionLoading === selectedTicket.id.toString()}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          Fermer
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleReply}
                      disabled={!replyMessage.trim() || actionLoading === 'reply'}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {actionLoading === 'reply' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>Envoyer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ContentLoader>
    </AdminLayout>
  )
}
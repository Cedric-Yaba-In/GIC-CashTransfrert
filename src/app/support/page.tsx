'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, MessageCircle } from 'lucide-react'

interface SupportForm {
  email: string
  transactionReference: string
  message: string
}

export default function SupportPage() {
  const [ticket, setTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<SupportForm>()

  const email = watch('email')
  const transactionReference = watch('transactionReference')

  useEffect(() => {
    if (email && transactionReference) {
      fetchTicket()
    }
  }, [email, transactionReference])

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets?email=${email}&reference=${transactionReference}`)
      
      if (response.ok) {
        const data = await response.json()
        setTicket(data)
        setMessages(data?.messages || [])
      } else {
        setTicket(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to fetch ticket')
    }
  }

  const onSubmit = async (data: SupportForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('Message envoyé!')
        setMessages([...messages, result.newMessage])
        reset({ message: '' })
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo.png" alt="GIC Logo" width={32} height={32} />
              <span className="font-bold text-lg">GIC CashTransfer</span>
            </Link>
            <Link href="/" className="flex items-center text-gray-600 hover:text-primary-600">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Support client
            </h1>
            <p className="text-gray-600">
              Besoin d'aide ? Contactez notre équipe support en utilisant votre référence de transaction
            </p>
          </div>

          {/* Access Form */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-4">Accéder à votre ticket de support</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email utilisé pour la transaction</label>
                <input
                  {...register('email', { 
                    required: 'Email requis',
                    pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' }
                  })}
                  type="email"
                  className="input"
                  placeholder="votre@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Référence de transaction</label>
                <input
                  {...register('transactionReference', { required: 'Référence requise' })}
                  className="input"
                  placeholder="GIC1234567890ABCD"
                />
                {errors.transactionReference && (
                  <p className="text-red-500 text-sm mt-1">{errors.transactionReference.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Messages */}
          {ticket && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Conversation</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ticket.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                  ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticket.status === 'OPEN' ? 'Ouvert' :
                   ticket.status === 'IN_PROGRESS' ? 'En cours' : 'Fermé'}
                </span>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun message pour le moment</p>
                    <p className="text-sm">Commencez la conversation en envoyant un message ci-dessous</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isAdmin
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-primary-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.isAdmin ? 'text-gray-500' : 'text-primary-100'
                        }`}>
                          {message.isAdmin ? 'Support' : 'Vous'} • {new Date(message.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Message Form */}
          {email && transactionReference && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Votre message</label>
                <textarea
                  {...register('message', { required: 'Message requis' })}
                  rows={4}
                  className="input resize-none"
                  placeholder="Décrivez votre problème ou posez votre question..."
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? 'Envoi...' : 'Envoyer le message'}
                <Send className="ml-2 h-4 w-4" />
              </button>
            </form>
          )}

          {/* Help Section */}
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold mb-3">Questions fréquentes</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Combien de temps prend un transfert ?</p>
                  <p className="text-gray-600">Les transferts sont généralement traités sous 24h après validation.</p>
                </div>
                <div>
                  <p className="font-medium">Comment suivre ma transaction ?</p>
                  <p className="text-gray-600">Utilisez votre référence de transaction sur la page de suivi.</p>
                </div>
                <div>
                  <p className="font-medium">Que faire si ma transaction est rejetée ?</p>
                  <p className="text-gray-600">Contactez le support avec votre référence pour connaître les raisons.</p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="font-semibold text-primary-900 mb-3">Autres moyens de contact</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-primary-800">Email</p>
                  <p className="text-primary-700">support@gicpromoteltd.com</p>
                </div>
                <div>
                  <p className="font-medium text-primary-800">Téléphone</p>
                  <p className="text-primary-700">+33 1 23 45 67 89</p>
                </div>
                <div>
                  <p className="font-medium text-primary-800">Horaires</p>
                  <p className="text-primary-700">Lun-Ven: 9h-18h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
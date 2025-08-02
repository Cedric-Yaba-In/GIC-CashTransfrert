'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { MessageCircle, Send, User, Bot, Clock, CheckCircle, Mail, Phone, MapPin, HelpCircle, FileText, Shield, Zap } from 'lucide-react'
import Header from '@/components/Header'

interface SupportForm {
  email: string
  transactionReference: string
  message: string
}

export default function SupportPage() {
  const [ticket, setTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'ticket' | 'faq'>('ticket')

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

  const faqItems = [
    {
      question: "Combien de temps prend un transfert ?",
      answer: "Les transferts sont généralement traités sous 24h après validation administrative. Les transferts automatiques via API peuvent être plus rapides."
    },
    {
      question: "Comment suivre ma transaction ?",
      answer: "Utilisez votre référence de transaction (format GIC...) sur la page de suivi pour voir l'état en temps réel de votre transfert."
    },
    {
      question: "Que faire si ma transaction est rejetée ?",
      answer: "En cas de rejet, vous recevrez un email avec les raisons. Contactez le support avec votre référence pour plus d'informations."
    },
    {
      question: "Puis-je annuler un transfert ?",
      answer: "Les transferts peuvent être annulés uniquement s'ils n'ont pas encore été validés par l'administration. Contactez le support rapidement."
    },
    {
      question: "Quels sont les frais de transfert ?",
      answer: "Nous appliquons des frais fixes de 5€ quel que soit le montant envoyé, pour plus de transparence."
    },
    {
      question: "Comment récupérer ma facture ?",
      answer: "Votre facture est automatiquement envoyée par email après validation. Vous pouvez aussi la télécharger depuis la page de suivi."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-6">
              <MessageCircle className="h-8 w-8 text-secondary-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Centre d'aide et support
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Notre équipe est là pour vous accompagner. Trouvez des réponses rapides ou contactez-nous directement.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl p-1 shadow-lg">
              <button
                onClick={() => setActiveTab('ticket')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'ticket'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Ouvrir un ticket
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'faq'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Questions fréquentes
              </button>
            </div>
          </div>

          {activeTab === 'ticket' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Ticket Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Contactez notre support</h2>
                  
                  {/* Access Form */}
                  <div className="bg-blue-50 rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Accès sécurisé à votre ticket
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          Email utilisé pour la transaction
                        </label>
                        <input
                          {...register('email', { 
                            required: 'Email requis',
                            pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' }
                          })}
                          type="email"
                          className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="votre@email.com"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          Référence de transaction
                        </label>
                        <input
                          {...register('transactionReference', { required: 'Référence requise' })}
                          className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="GIC1234567890ABCD"
                        />
                        {errors.transactionReference && (
                          <p className="text-red-500 text-sm mt-1">{errors.transactionReference.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conversation */}
                  {ticket && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Conversation</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          ticket.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.status === 'OPEN' ? 'Ouvert' :
                           ticket.status === 'IN_PROGRESS' ? 'En cours' : 'Fermé'}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                        {messages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 mb-2">Aucun message pour le moment</p>
                            <p className="text-sm text-gray-400">Commencez la conversation en envoyant un message ci-dessous</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {messages.map((message, index) => (
                              <div
                                key={index}
                                className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'}`}
                              >
                                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                  message.isAdmin
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'bg-primary-600 text-white'
                                }`}>
                                  <div className="flex items-center space-x-2 mb-1">
                                    {message.isAdmin ? (
                                      <Bot className="h-4 w-4 text-primary-600" />
                                    ) : (
                                      <User className="h-4 w-4" />
                                    )}
                                    <span className="text-xs font-medium">
                                      {message.isAdmin ? 'Support GIC' : 'Vous'}
                                    </span>
                                  </div>
                                  <p className="text-sm">{message.message}</p>
                                  <p className={`text-xs mt-2 ${
                                    message.isAdmin ? 'text-gray-500' : 'text-primary-100'
                                  }`}>
                                    {new Date(message.createdAt).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Form */}
                  {email && transactionReference && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Votre message
                        </label>
                        <textarea
                          {...register('message', { required: 'Message requis' })}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          placeholder="Décrivez votre problème ou posez votre question..."
                        />
                        {errors.message && (
                          <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Envoi...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Envoyer le message</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-primary-600" />
                    Autres moyens de contact
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-gray-600">support@gicpromoteltd.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Téléphone</p>
                        <p className="text-sm text-gray-600">+33 1 23 45 67 89</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Horaires</p>
                        <p className="text-sm text-gray-600">24/7 - Support continu</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-primary-600" />
                    Réponse rapide
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Notre équipe s'engage à répondre à tous les tickets dans les 2 heures pendant les heures ouvrables.
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-primary-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Temps de réponse moyen: 45 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <HelpCircle className="h-6 w-6 mr-3 text-primary-600" />
                  Questions fréquemment posées
                </h2>
                
                <div className="space-y-6">
                  {faqItems.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start">
                        <span className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        {item.question}
                      </h3>
                      <p className="text-gray-600 leading-relaxed ml-9">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-gray-600 mb-4">Vous ne trouvez pas la réponse à votre question ?</p>
                  <button
                    onClick={() => setActiveTab('ticket')}
                    className="btn-primary inline-flex items-center"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Ouvrir un ticket de support
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Download, MessageCircle } from 'lucide-react'
import { generateInvoicePDF, sendInvoiceByEmail } from '@/lib/pdf'

export default function TrackReferencePage() {
  const params = useParams()
  const reference = params.reference as string
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sendingInvoice, setSendingInvoice] = useState(false)

  useEffect(() => {
    if (reference) {
      fetchTransaction()
    }
  }, [reference])

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions?reference=${reference}`)
      const result = await response.json()
      
      if (response.ok) {
        setTransaction(result)
      } else {
        toast.error('Transaction non trouvée')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = () => {
    if (!transaction) return
    
    const pdfBlob = generateInvoicePDF(transaction)
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facture-${transaction.reference}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const sendInvoice = async () => {
    if (!transaction) return
    
    setSendingInvoice(true)
    try {
      await sendInvoiceByEmail(transaction, transaction.senderEmail)
      toast.success('Facture envoyée par email')
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSendingInvoice(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PAID': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente'
      case 'PAID': return 'Payé'
      case 'APPROVED': return 'Approuvé'
      case 'REJECTED': return 'Rejeté'
      case 'COMPLETED': return 'Terminé'
      default: return status
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

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Transaction non trouvée</h1>
          <p className="text-gray-600 mb-8">La référence {reference} n'existe pas ou est invalide.</p>
          <Link href="/track" className="btn-primary">
            Nouvelle recherche
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo.png" alt="GIC Logo" width={32} height={32} />
              <span className="font-bold text-lg">GIC CashTransfer</span>
            </Link>
            <Link href="/track" className="flex items-center text-gray-600 hover:text-primary-600">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Nouvelle recherche
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Transaction {transaction.reference}
            </h1>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
              {getStatusText(transaction.status)}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Détails de la transaction</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Référence:</span>
                    <span className="font-medium">{transaction.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant:</span>
                    <span className="font-medium">
                      {transaction.amount} {transaction.senderCountry.currencyCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais:</span>
                    <span className="font-medium">
                      {transaction.fees} {transaction.senderCountry.currencyCode}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600 font-semibold">Total:</span>
                    <span className="font-bold text-lg">
                      {transaction.totalAmount} {transaction.senderCountry.currencyCode}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Expéditeur</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Nom:</span> {transaction.senderName}</p>
                  <p><span className="text-gray-600">Email:</span> {transaction.senderEmail}</p>
                  <p><span className="text-gray-600">Pays:</span> {transaction.senderCountry.name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Destinataire</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Nom:</span> {transaction.receiverName}</p>
                  <p><span className="text-gray-600">Téléphone:</span> {transaction.receiverPhone}</p>
                  <p><span className="text-gray-600">Pays:</span> {transaction.receiverCountry.name}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Historique</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-primary-600 rounded-full mt-2 mr-4"></div>
                    <div>
                      <p className="font-medium">Transaction créée</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {transaction.status !== 'PENDING' && (
                    <div className="flex items-start">
                      <div className={`w-3 h-3 rounded-full mt-2 mr-4 ${
                        transaction.status === 'APPROVED' || transaction.status === 'COMPLETED' 
                          ? 'bg-green-600' 
                          : 'bg-red-600'
                      }`}></div>
                      <div>
                        <p className="font-medium">
                          {transaction.status === 'APPROVED' ? 'Transaction approuvée' : 
                           transaction.status === 'REJECTED' ? 'Transaction rejetée' :
                           'Transaction mise à jour'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.updatedAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={downloadInvoice}
                className="btn-primary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger la facture
              </button>
              
              <button
                onClick={sendInvoice}
                disabled={sendingInvoice}
                className="btn-secondary flex items-center"
              >
                {sendingInvoice ? 'Envoi...' : 'Envoyer par email'}
              </button>

              <Link 
                href={`/support?email=${transaction.senderEmail}&reference=${transaction.reference}`}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter le support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
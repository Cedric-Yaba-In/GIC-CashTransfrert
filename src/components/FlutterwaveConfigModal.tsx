'use client'

import { useState, useEffect } from 'react'
import { X, Key, Eye, EyeOff, CheckCircle, AlertCircle, TestTube, Loader2, Shield, Lock, Save, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

interface FlutterwaveConfigModalProps {
  isOpen: boolean
  onClose: () => void
  countryId: number
  countryName: string
  onSuccess: () => void
}

export default function FlutterwaveConfigModal({
  isOpen,
  onClose,
  countryId,
  countryName,
  onSuccess
}: FlutterwaveConfigModalProps) {
  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [encryptionKey, setEncryptionKey] = useState('')
  const [webhookHash, setWebhookHash] = useState('')
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showEncryptionKey, setShowEncryptionKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (isOpen && countryId) {
      loadExistingConfig()
    }
  }, [isOpen, countryId])

  const loadExistingConfig = async () => {
    try {
      const response = await fetch(`/api/admin/countries/${countryId}/flutterwave`)
      const data = await response.json()
      
      if (data.configured) {
        setPublicKey(data.publicKey || '')
        setSecretKey(data.secretKey || '')
        setEncryptionKey(data.encryptionKey || '')
        setWebhookHash(data.webhookHash || '')
        setIsConfigured(true)
      } else {
        setPublicKey('')
        setSecretKey('')
        setEncryptionKey('')
        setWebhookHash('')
        setIsConfigured(false)
      }
    } catch (error) {
      console.error('Error loading config:', error)
      setIsConfigured(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/countries/${countryId}/flutterwave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey.trim(),
          secretKey: secretKey.trim(),
          encryptionKey: encryptionKey.trim(),
          webhookHash: webhookHash.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Configuration sauvegardée', 'La configuration Flutterwave a été mise à jour avec succès')
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Erreur de configuration')
        toast.error('Erreur de sauvegarde', data.error || 'Impossible de sauvegarder la configuration')
      }
    } catch (error) {
      setError('Erreur de connexion')
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer la configuration Flutterwave pour ce pays ?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/countries/${countryId}/flutterwave`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Configuration supprimée', 'La configuration Flutterwave a été supprimée')
        onSuccess()
        onClose()
      } else {
        setError('Erreur de suppression')
        toast.error('Erreur de suppression', 'Impossible de supprimer la configuration')
      }
    } catch (error) {
      setError('Erreur de connexion')
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    if (!publicKey.trim() || !secretKey.trim()) {
      setTestResult({ success: false, message: 'Veuillez remplir les clés publique et secrète' })
      toast.error('Champs requis', 'Veuillez remplir les clés publique et secrète')
      return
    }

    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch(`/api/admin/countries/${countryId}/flutterwave/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publicKey: publicKey.trim(),
          secretKey: secretKey.trim()
        })
      })

      const result = await response.json()

      if (response.ok) {
        setTestResult({ success: true, message: result.message })
        toast.success('Test réussi', result.message)
      } else {
        setTestResult({ success: false, message: result.message })
        toast.error('Test échoué', result.message)
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erreur de connexion' })
      toast.error('Erreur de test', 'Impossible de tester la connexion')
    } finally {
      setTesting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Key className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Configuration Flutterwave</h2>
                <p className="text-blue-100">{countryName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            )}

            {isConfigured && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-green-700 font-medium">Flutterwave déjà configuré pour ce pays</span>
              </div>
            )}

            {testResult && (
              <div className={`border-2 rounded-xl p-4 flex items-center ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                )}
                <span className={`font-medium ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                </span>
              </div>
            )}

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <label className="block text-sm font-semibold text-blue-800 mb-3 flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Clé publique *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                <input
                  type="text"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  placeholder="FLWPUBK_TEST-..."
                  required
                />
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <label className="block text-sm font-semibold text-red-800 mb-3 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Clé secrète *
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-400" />
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white transition-all"
                  placeholder="FLWSECK_TEST-..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600 transition-colors"
                >
                  {showSecretKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <label className="block text-sm font-semibold text-purple-800 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Clé d'encryption *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                <input
                  type={showEncryptionKey ? 'text' : 'password'}
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                  placeholder="FLWSECK_TEST-..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors"
                >
                  {showEncryptionKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Hash Webhook (optionnel)
              </label>
              <input
                type="text"
                value={webhookHash}
                onChange={(e) => setWebhookHash(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                placeholder="Hash pour sécuriser les webhooks"
              />
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-green-800 flex items-center">
                    <TestTube className="w-5 h-5 mr-2" />
                    Test de connexion
                  </h4>
                  <p className="text-sm text-green-600 mt-1">Vérifiez que les clés fonctionnent correctement</p>
                </div>
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testing || !publicKey.trim() || !secretKey.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  <span>{testing ? 'Test en cours...' : 'Tester la connexion'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{loading ? 'Sauvegarde...' : isConfigured ? 'Mettre à jour' : 'Sauvegarder'}</span>
            </button>
            
            {isConfigured && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{loading ? 'Suppression...' : 'Supprimer'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
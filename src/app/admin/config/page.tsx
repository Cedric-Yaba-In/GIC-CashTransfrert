'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { Settings, Save, Eye, EyeOff, Key, Mail, Smartphone, CreditCard, Globe, Shield, Briefcase } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import ContentLoader from '@/components/ContentLoader'

interface Config {
  id: number
  key: string
  value: string
  category: string
  type: string
  label: string
  required: boolean
  encrypted: boolean
}

const categoryConfig = {
  app: {
    icon: Globe,
    title: 'Application',
    description: 'Paramètres généraux de l\'application',
    bgColor: 'from-[#0B3371] to-[#0B3371]/80',
    lightBg: 'bg-[#0B3371]/5',
    borderColor: 'border-[#0B3371]/20',
    testable: false
  },
  email: {
    icon: Mail,
    title: 'Email',
    description: 'Configuration du serveur SMTP et notifications',
    bgColor: 'from-[#F37521] to-[#F37521]/80',
    lightBg: 'bg-[#F37521]/5',
    borderColor: 'border-[#F37521]/20',
    testable: true
  },
  sms: {
    icon: Smartphone,
    title: 'SMS',
    description: 'Configuration Twilio pour les notifications SMS',
    bgColor: 'from-slate-600 to-slate-700',
    lightBg: 'bg-slate-50',
    borderColor: 'border-slate-200',
    testable: true
  },
  payment: {
    icon: CreditCard,
    title: 'Paiements',
    description: 'Configuration des passerelles de paiement',
    bgColor: 'from-[#F37521] to-[#F37521]/80',
    lightBg: 'bg-[#F37521]/5',
    borderColor: 'border-[#F37521]/20',
    testable: true
  },
  api: {
    icon: Globe,
    title: 'APIs Externes',
    description: 'Configuration des services externes',
    bgColor: 'from-[#0B3371] to-[#0B3371]/80',
    lightBg: 'bg-[#0B3371]/5',
    borderColor: 'border-[#0B3371]/20',
    testable: true
  },
  security: {
    icon: Shield,
    title: 'Sécurité',
    description: 'Clés de chiffrement et authentification',
    bgColor: 'from-slate-700 to-slate-800',
    lightBg: 'bg-slate-50',
    borderColor: 'border-slate-200',
    testable: false
  },
  business: {
    icon: Briefcase,
    title: 'Règles Métier',
    description: 'Paramètres financiers et limites',
    bgColor: 'from-[#0B3371] to-[#0B3371]/80',
    lightBg: 'bg-[#0B3371]/5',
    borderColor: 'border-[#0B3371]/20',
    testable: false
  }
}

export default function ConfigPage() {
  const router = useRouter()
  const toast = useToast()
  const [configs, setConfigs] = useState<Config[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set())
  const [changes, setChanges] = useState<Map<string, string>>(new Map())
  const [testingServices, setTestingServices] = useState<Set<string>>(new Set())
  const [testResults, setTestResults] = useState<Map<string, { success: boolean, message: string }>>(new Map())
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
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        console.log('Configurations chargées:', data.length, 'items')
        setConfigs(data)
      } else {
        console.error('Erreur API:', response.status)
        toast.error('Erreur de chargement', 'Erreur lors du chargement des configurations')
      }
    } catch (error) {
      console.error('Erreur fetch:', error)
      toast.error('Erreur de chargement', 'Erreur lors du chargement des configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleValueChange = (key: string, value: string) => {
    const newChanges = new Map(changes)
    newChanges.set(key, value)
    setChanges(newChanges)
  }

  const togglePasswordVisibility = (key: string) => {
    const newShowPasswords = new Set(showPasswords)
    if (newShowPasswords.has(key)) {
      newShowPasswords.delete(key)
    } else {
      newShowPasswords.add(key)
    }
    setShowPasswords(newShowPasswords)
  }

  const saveChanges = async () => {
    if (changes.size === 0) {
      toast.warning('Aucune modification', 'Aucune modification à sauvegarder')
      return
    }

    setSaving(true)
    try {
      const updates = Array.from(changes.entries()).map(([key, value]) => ({ key, value }))
      
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        toast.success('Sauvegarde réussie', 'Toutes les configurations ont été mises à jour')
        setChanges(new Map())
        fetchConfigs()
      } else {
        toast.error('Erreur de sauvegarde', 'Impossible de sauvegarder les configurations')
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de sauvegarder les configurations')
    } finally {
      setSaving(false)
    }
  }

  const testService = async (category: string) => {
    setTestingServices(prev => new Set(Array.from(prev).concat(category)))
    
    try {
      const response = await fetch(`/api/config/test/${category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      setTestResults(prev => new Map(Array.from(prev).concat([[category, {
        success: response.ok,
        message: result.message || (response.ok ? 'Test réussi' : 'Test échoué')
      }]])))
      
      if (response.ok) {
        toast.success('Test réussi', `La configuration ${category} fonctionne correctement`)
      } else {
        toast.error('Test échoué', `${category}: ${result.message}`)
      }
    } catch (error) {
      setTestResults(prev => new Map(Array.from(prev).concat([[category, {
        success: false,
        message: 'Erreur de connexion'
      }]])))
      toast.error('Erreur de test', `Impossible de tester la configuration ${category}`)
    } finally {
      setTestingServices(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(category)
        return newSet
      })
    }
  }

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push(config)
    return acc
  }, {} as Record<string, Config[]>)

  // Debug: afficher les catégories disponibles
  console.log('Catégories disponibles:', Object.keys(groupedConfigs))
  console.log('Configurations groupées:', groupedConfigs)



  return (
    <AdminLayout user={user} onLogout={logout}>
      <ContentLoader loading={loading}>
        {/* Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {configs.length === 0 && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/seed-config', { method: 'POST' })
                    const result = await response.json()
                    if (response.ok) {
                      toast.success('Configurations créées', result.message)
                      fetchConfigs()
                    } else {
                      toast.error('Erreur', result.error)
                    }
                  } catch (error) {
                    toast.error('Erreur', 'Impossible de créer les configurations')
                  }
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0B3371] to-[#0B3371]/80 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Settings className="w-5 h-5" />
                <span>Initialiser les configurations</span>
              </button>
            )}
            <div className="flex items-center space-x-4">
              {changes.size > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-amber-700 font-medium">{changes.size} modification{changes.size > 1 ? 's' : ''} en attente</span>
                </div>
              )}
              
              <button
                onClick={saveChanges}
                disabled={saving || changes.size === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  changes.size > 0 
                    ? 'bg-gradient-to-r from-[#F37521] to-[#F37521]/80 hover:from-[#F37521]/90 hover:to-[#F37521]/70 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Cards */}
        <div className="grid lg:grid-cols-2 gap-8">
          {Object.keys(groupedConfigs).length > 0 ? (
            // Ordre des sections : app, business, payment, sms, email, api, security
            ['app', 'business', 'payment', 'sms', 'email', 'api', 'security']
              .filter(category => groupedConfigs[category])
              .map((category) => {
              const categoryConfigs = groupedConfigs[category]
              const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.app
              const IconComponent = config.icon
              const hasChanges = categoryConfigs.some(c => changes.has(c.key))
              
              return (
                <div key={category} className={`bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                  hasChanges ? 'border-amber-300 ring-2 ring-amber-100' : config.borderColor
                }`}>
                  {/* Card Header */}
                  <div className={`bg-gradient-to-r ${config.bgColor} p-6 rounded-t-2xl`}>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{config.title}</h3>
                        <p className="text-white/80 text-sm">{config.description}</p>
                      </div>
                      {hasChanges && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-white/20 rounded-full">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-medium">Modifié</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6">
                    {config.testable && (
                      <div className="mb-6 p-4 bg-white/50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-1">Test de connexion</h4>
                            <p className="text-sm text-gray-600">Vérifiez que la configuration fonctionne correctement</p>
                          </div>
                          <button
                            onClick={() => testService(category)}
                            disabled={testingServices.has(category)}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            {testingServices.has(category) ? (
                              <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Test...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium">Tester</span>
                              </>
                            )}
                          </button>
                        </div>
                        {testResults.has(category) && (
                          <div className={`mt-3 p-3 rounded-lg flex items-center space-x-2 ${
                            testResults.get(category)?.success 
                              ? 'bg-green-50 border border-green-200 text-green-800' 
                              : 'bg-red-50 border border-red-200 text-red-800'
                          }`}>
                            {testResults.get(category)?.success ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span className="text-sm font-medium">{testResults.get(category)?.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-6">
                      {categoryConfigs.map((configItem) => (
                        <div key={configItem.key} className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          changes.has(configItem.key) 
                            ? 'border-amber-300 bg-amber-50' 
                            : `${config.lightBg} ${config.borderColor}`
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                              <span>{configItem.label}</span>
                              {configItem.required && <span className="text-red-500">*</span>}
                              {configItem.encrypted && <Key className="w-4 h-4 text-gray-400" />}
                            </label>
                            {changes.has(configItem.key) && (
                              <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                Modifié
                              </span>
                            )}
                          </div>
                          
                          <div className="relative">
                            {configItem.type === 'PASSWORD' ? (
                              <div className="flex">
                                <input
                                  type={showPasswords.has(configItem.key) ? 'text' : 'password'}
                                  value={changes.get(configItem.key) ?? configItem.value ?? ''}
                                  onChange={(e) => handleValueChange(configItem.key, e.target.value)}
                                  className="flex-1 px-4 py-3 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
                                  placeholder={configItem.encrypted ? 'Valeur chiffrée' : 'Entrez votre mot de passe'}
                                />
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(configItem.key)}
                                  className="px-4 py-3 border border-l-0 border-gray-200 rounded-r-xl hover:bg-gray-50 transition-colors"
                                >
                                  {showPasswords.has(configItem.key) ? (
                                    <EyeOff className="w-5 h-5 text-gray-500" />
                                  ) : (
                                    <Eye className="w-5 h-5 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            ) : configItem.type === 'NUMBER' ? (
                              <input
                                type="number"
                                value={changes.get(configItem.key) ?? configItem.value ?? ''}
                                onChange={(e) => handleValueChange(configItem.key, e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
                                placeholder="Entrez une valeur numérique"
                              />
                            ) : (
                              <input
                                type="text"
                                value={changes.get(configItem.key) ?? configItem.value ?? ''}
                                onChange={(e) => handleValueChange(configItem.key, e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
                                placeholder="Entrez la valeur"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-16 border border-gray-200 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Settings className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Aucune configuration disponible</h3>
                <p className="text-gray-500 max-w-md mx-auto">Les paramètres de configuration apparaîtront ici une fois le système initialisé.</p>
              </div>
            </div>
          )}
        </div>
      </ContentLoader>
    </AdminLayout>
  )
}
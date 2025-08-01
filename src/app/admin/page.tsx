'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, Users, Clock, CheckCircle } from 'lucide-react'

interface LoginForm {
  email: string
  password: string
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const userData = localStorage.getItem('adminUser')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
      fetchStats()
    }
  }, [])

  const onLogin = async (data: LoginForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (response.ok) {
        localStorage.setItem('adminToken', result.token)
        localStorage.setItem('adminUser', JSON.stringify(result.user))
        setUser(result.user)
        toast.success('Connexion réussie!')
        fetchStats()
      } else {
        toast.error(result.error || 'Erreur de connexion')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats')
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setUser(null)
    toast.success('Déconnexion réussie')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="GIC Logo" width={64} height={64} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600">GIC CashTransfer</p>
          </div>

          <form onSubmit={handleSubmit(onLogin)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...register('email', { 
                  required: 'Email requis',
                  pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' }
                })}
                type="email"
                className="input"
                placeholder="admin@gicpromoteltd.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mot de passe</label>
              <input
                {...register('password', { required: 'Mot de passe requis' })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
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
                <h1 className="font-bold text-lg">Administration GIC</h1>
                <p className="text-sm text-gray-600">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Bonjour, {user.name}</span>
              <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex space-x-6">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg">
              Dashboard
            </button>
            <button 
              onClick={() => router.push('/admin/transactions')}
              className="px-4 py-2 text-gray-600 hover:text-primary-600"
            >
              Transactions
            </button>
            <button 
              onClick={() => router.push('/admin/wallets')}
              className="px-4 py-2 text-gray-600 hover:text-primary-600"
            >
              Wallets
            </button>
            <button 
              onClick={() => router.push('/admin/countries')}
              className="px-4 py-2 text-gray-600 hover:text-primary-600"
            >
              Pays
            </button>
          </div>
        </nav>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-secondary-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold">{stats.pendingTransactions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Approuvées</p>
                <p className="text-2xl font-bold">{stats.approvedTransactions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Volume Total</p>
                <p className="text-2xl font-bold">{stats.totalVolume || '0'} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Transactions par jour</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyTransactions || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Transactions récentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Référence</th>
                  <th className="text-left py-2">Expéditeur</th>
                  <th className="text-left py-2">Montant</th>
                  <th className="text-left py-2">Statut</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentTransactions || []).map((transaction: any) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="py-2">{transaction.reference}</td>
                    <td className="py-2">{transaction.senderName}</td>
                    <td className="py-2">{transaction.amount} {transaction.senderCountry?.currencyCode}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-2">{new Date(transaction.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
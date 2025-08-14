'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, Menu, X, BarChart3, CreditCard, Wallet, Globe, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import NavigationLoader, { triggerNavigationLoading } from './NavigationLoader'

interface AdminLayoutProps {
  children: React.ReactNode
  user: any
  onLogout: () => void
}

export default function AdminLayout({ children, user, onLogout }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Tableau de bord exécutif'
    if (pathname === '/admin/transactions') return 'Gestion des transactions'
    if (pathname === '/admin/wallets') return 'Gestion des portefeuilles'
    if (pathname === '/admin/countries') return 'Gestion des pays'
    if (pathname === '/admin/payment-methods') return 'Méthodes de paiement'
    if (pathname === '/admin/transfer-rates') return 'Taux de transfert'
    if (pathname === '/admin/config') return 'Configuration système'
    return 'Administration'
  }

  const isActive = (path: string) => pathname === path

  const handleNavigation = (path: string) => {
    if (pathname !== path) {
      triggerNavigationLoading()
      router.push(path)
    }
  }

  const menuItems = [
    { path: '/admin', icon: BarChart3, label: 'Dashboard', title: 'Tableau de bord' },
    { path: '/admin/transactions', icon: CreditCard, label: 'Transactions', title: 'Gestion des transactions' },
    { path: '/admin/wallets', icon: Wallet, label: 'Wallets', title: 'Gestion des portefeuilles' },
    { path: '/admin/payment-methods', icon: CreditCard, label: 'Méthodes', title: 'Méthodes de paiement' },
    { path: '/admin/countries', icon: Globe, label: 'Pays', title: 'Gestion des pays' },
    { path: '/admin/transfer-rates', icon: Settings, label: 'Taux', title: 'Taux de transfert' },
    { path: '/admin/config', icon: Settings, label: 'Configuration', title: 'Configuration système' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-xl border-r border-gray-200 transition-all duration-300 flex flex-col z-40 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } hidden lg:flex`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
              <img src="/logo.png" alt="GIC Logo" className="w-10 h-10 rounded-xl shadow-lg" />
              {!sidebarCollapsed && (
                <div>
                  <h1 className="font-bold text-lg text-[#0B3371]">GIC CashTransfer</h1>
                  <p className="text-xs text-gray-500">Administration</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full mt-3 p-2 hover:bg-gray-100 rounded-lg transition-colors flex justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-[#0B3371] text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#0B3371]'
                }`}
                title={sidebarCollapsed ? item.title : ''}
              >
                <Icon className="w-5 h-5" />
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center space-x-3 p-3 rounded-xl bg-gray-50 ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}>
            <div className="w-8 h-8 bg-[#F37521] rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0B3371] truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            className={`w-full flex items-center space-x-3 px-4 py-3 mt-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={sidebarCollapsed ? 'Déconnexion' : ''}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src="/logo.png" alt="GIC Logo" className="w-10 h-10 rounded-xl shadow-lg" />
                  <div>
                    <h1 className="font-bold text-lg text-[#0B3371]">GIC CashTransfer</h1>
                    <p className="text-xs text-gray-500">Administration</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      handleNavigation(item.path)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-[#0B3371] text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#0B3371]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 h-screen ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 right-0 z-30 transition-all duration-300" style={{
          left: sidebarCollapsed ? '64px' : '256px'
        }}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                  <p className="text-sm text-gray-500">Gérez votre plateforme de transfert d'argent</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button className="p-3 text-gray-500 hover:text-[#0B3371] hover:bg-gray-100 rounded-xl transition-all duration-200 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F37521] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xs text-white font-bold">3</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto mt-20 relative">
          <NavigationLoader />
          {children}
        </main>
      </div>
    </div>
  )
}
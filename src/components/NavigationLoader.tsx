'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function NavigationLoader() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setLoading(false)
  }, [pathname])

  // Expose function to trigger loading
  useEffect(() => {
    const handleRouteStart = () => setLoading(true)
    
    // Listen for programmatic navigation
    window.addEventListener('routeChangeStart', handleRouteStart)
    
    return () => {
      window.removeEventListener('routeChangeStart', handleRouteStart)
    }
  }, [])

  if (!loading) return null

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-40 flex items-center justify-center rounded-lg">
      <div className="flex flex-col items-center space-y-4 p-8">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#0B3371] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800 mb-1">Chargement en cours...</p>
          <p className="text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    </div>
  )
}

// Helper function to trigger navigation loading
export const triggerNavigationLoading = () => {
  window.dispatchEvent(new Event('routeChangeStart'))
}
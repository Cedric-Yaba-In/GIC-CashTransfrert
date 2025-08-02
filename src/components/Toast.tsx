'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 10)

    // Auto-fermeture
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-amber-600" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />
    }
  }

  const getStyles = () => {
    const baseStyles = "border-l-4 shadow-xl backdrop-blur-sm"
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50/95 border-green-500 text-green-900`
      case 'error':
        return `${baseStyles} bg-red-50/95 border-red-500 text-red-900`
      case 'warning':
        return `${baseStyles} bg-amber-50/95 border-amber-500 text-amber-900`
      case 'info':
        return `${baseStyles} bg-blue-50/95 border-blue-500 text-blue-900`
    }
  }

  return (
    <div
      className={`
        w-96 max-w-sm rounded-xl p-4 transition-all duration-300 ease-out
        ${getStyles()}
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm leading-5">
                {title}
              </h4>
              {message && (
                <p className="mt-1 text-sm opacity-90 leading-5">
                  {message}
                </p>
              )}
            </div>
            
            <button
              onClick={handleClose}
              className="ml-3 flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-xl overflow-hidden">
        <div 
          className={`h-full transition-all ease-linear ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-amber-500' :
            'bg-blue-500'
          }`}
          style={{
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
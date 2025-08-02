'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Toast, { ToastProps } from './Toast'

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export default function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString()
    const newToast = {
      ...toast,
      id,
      onClose: removeToast
    }
    
    console.log('Toast créé:', newToast)
    setToasts(prev => {
      const newToasts = [...prev, newToast]
      console.log('Toasts actuels:', newToasts.length)
      return newToasts
    })
  }

  const success = (title: string, message?: string) => {
    showToast({ type: 'success', title, message })
  }

  const error = (title: string, message?: string) => {
    showToast({ type: 'error', title, message })
  }

  const warning = (title: string, message?: string) => {
    showToast({ type: 'warning', title, message })
  }

  const info = (title: string, message?: string) => {
    showToast({ type: 'info', title, message })
  }

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
        <div className="space-y-4">
          {toasts.map((toast, index) => (
            <div key={toast.id} className="pointer-events-auto" style={{ zIndex: 9999 + index }}>
              <Toast {...toast} />
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
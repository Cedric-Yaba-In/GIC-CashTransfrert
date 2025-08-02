import './globals.css'
import { Inter } from 'next/font/google'
import ToastProvider from '@/components/ToastProvider'
import { syncDatabase } from '@/lib/db-sync'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GIC CashTransfer - Transfert d\'argent international',
  description: 'Envoyez de l\'argent rapidement et en toute sécurité avec GIC CashTransfer',
}

// Auto-sync database on app start
if (typeof window === 'undefined') {
  syncDatabase().catch(console.error)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
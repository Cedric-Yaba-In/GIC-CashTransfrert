import './globals.css'
import { Inter } from 'next/font/google'
import ToastProvider from '@/components/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GIC CashTransfer - Transfert d\'argent international',
  description: 'Envoyez de l\'argent rapidement et en toute sécurité avec GIC CashTransfer',
}

// Note: Database sync moved to API route for better performance

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
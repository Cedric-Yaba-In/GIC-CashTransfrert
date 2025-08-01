import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Clock, Globe } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="GIC Logo" width={40} height={40} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">GIC CashTransfer</h1>
                <p className="text-sm text-gray-600">GIC Promote LTD</p>
              </div>
            </div>
            <nav className="flex space-x-6">
              <Link href="/track" className="text-gray-600 hover:text-primary-600">
                Suivre un transfert
              </Link>
              <Link href="/support" className="text-gray-600 hover:text-primary-600">
                Support
              </Link>
              <Link href="/admin" className="btn-primary">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transférez de l'argent
              <span className="text-primary-600"> rapidement</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Envoyez de l'argent d'un pays à l'autre sans créer de compte. 
              Simple, rapide et sécurisé avec GIC CashTransfer.
            </p>
            <Link href="/transfer" className="btn-primary text-lg px-8 py-3 inline-flex items-center">
              Commencer un transfert
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi choisir GIC CashTransfer ?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sécurisé</h3>
              <p className="text-gray-600">
                Vos transactions sont protégées par des protocoles de sécurité avancés
              </p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rapide</h3>
              <p className="text-gray-600">
                Transferts traités rapidement avec validation administrative
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">International</h3>
              <p className="text-gray-600">
                Envoyez de l'argent vers de nombreux pays à travers le monde
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image src="/logo.png" alt="GIC Logo" width={32} height={32} />
                <div>
                  <h3 className="font-bold">GIC CashTransfer</h3>
                  <p className="text-sm text-gray-400">GIC Promote LTD</p>
                </div>
              </div>
              <p className="text-gray-400">
                Solution de transfert d'argent international simple et sécurisée.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/transfer">Nouveau transfert</Link></li>
                <li><Link href="/track">Suivre un transfert</Link></li>
                <li><Link href="/support">Support client</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-gray-400">
                <li>À propos</li>
                <li>Conditions d'utilisation</li>
                <li>Politique de confidentialité</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                Email: support@gicpromoteltd.com<br />
                Téléphone: +33 1 23 45 67 89
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GIC Promote LTD. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
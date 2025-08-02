import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Clock, Globe, CheckCircle, Star, Users, DollarSign, Smartphone, CreditCard, Building, Phone, Mail, MapPin } from 'lucide-react'
import Header from '@/components/Header'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                  <Star className="h-4 w-4 mr-2" />
                  Solution de transfert #1 en Afrique
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Transférez de l'argent
                  <span className="text-primary-600"> sans frontières</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Envoyez de l'argent rapidement et en toute sécurité vers plus de 50 pays. 
                  Aucun compte requis, frais transparents, support 24/7.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/transfer" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center">
                  Commencer un transfert
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="#how-it-works" className="px-8 py-4 border-2 border-gray-300 rounded-lg hover:border-primary-600 transition-colors text-gray-700 font-medium inline-flex items-center justify-center">
                  Comment ça marche
                </Link>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-600">Pays</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">2min</div>
                  <div className="text-sm text-gray-600">Transfert</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Sécurisé
                </div>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Montant à envoyer</div>
                      <div className="text-2xl font-bold text-primary-600">500 EUR</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Frais de transfert</span>
                      <span className="font-medium">5 EUR</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Taux de change</span>
                      <span className="font-medium">1 EUR = 655 XOF</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Le destinataire reçoit</span>
                      <span className="text-green-600">327,500 XOF</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                    Confirmer le transfert
                  </button>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-8 -left-8 bg-secondary-500 text-white p-4 rounded-full shadow-lg animate-bounce">
                <Shield className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -right-8 bg-green-500 text-white p-4 rounded-full shadow-lg animate-pulse">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gray-600">Ils nous font confiance</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Building className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-sm font-medium">Banque Centrale</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Shield className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-sm font-medium">Certifié ISO</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Users className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-sm font-medium">10K+ Clients</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Star className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-sm font-medium">4.9/5 Étoiles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir GIC CashTransfer ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une solution complète pour tous vos besoins de transfert d'argent international
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center group">
              <div className="bg-primary-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">100% Sécurisé</h3>
              <p className="text-gray-600 leading-relaxed">
                Vos transactions sont protégées par un chiffrement de niveau bancaire et des protocoles de sécurité avancés
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-secondary-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-10 w-10 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Ultra Rapide</h3>
              <p className="text-gray-600 leading-relaxed">
                Transferts traités en moins de 2 minutes avec validation administrative rapide
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-green-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Globe className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Mondial</h3>
              <p className="text-gray-600 leading-relaxed">
                Envoyez de l'argent vers plus de 50 pays avec des taux de change compétitifs
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 p-3 rounded-lg flex-shrink-0">
                  <Smartphone className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Sans inscription</h4>
                  <p className="text-gray-600">Envoyez de l'argent immédiatement sans créer de compte. Simple et rapide.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-secondary-100 p-3 rounded-lg flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-secondary-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Moyens de paiement flexibles</h4>
                  <p className="text-gray-600">Carte bancaire, virement, Mobile Money - choisissez ce qui vous convient.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Support 24/7</h4>
                  <p className="text-gray-600">Notre équipe est disponible 24h/24 pour vous accompagner.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Suivi en temps réel</h3>
                <p className="mb-6 opacity-90">
                  Suivez votre transfert à chaque étape avec des notifications automatiques
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Transaction créée</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Paiement confirmé</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">En cours de traitement</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm opacity-60">Transfert terminé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              Envoyez de l'argent en 3 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center relative">
              <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Remplissez le formulaire</h3>
              <p className="text-gray-600 mb-6">
                Saisissez les informations de l'expéditeur et du destinataire, ainsi que le montant à envoyer
              </p>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">De:</span>
                    <span className="font-medium">France</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vers:</span>
                    <span className="font-medium">Sénégal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant:</span>
                    <span className="font-medium">500 EUR</span>
                  </div>
                </div>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-8 -right-4 text-primary-300">
                <ArrowRight className="h-8 w-8" />
              </div>
            </div>

            <div className="text-center relative">
              <div className="bg-secondary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Choisissez le paiement</h3>
              <p className="text-gray-600 mb-6">
                Sélectionnez votre moyen de paiement préféré parmi les options disponibles
              </p>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 border rounded">
                    <CreditCard className="h-5 w-5 text-primary-600" />
                    <span className="text-sm">Carte bancaire</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 border rounded bg-primary-50">
                    <Smartphone className="h-5 w-5 text-primary-600" />
                    <span className="text-sm font-medium">Mobile Money</span>
                  </div>
                </div>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-8 -right-4 text-secondary-300">
                <ArrowRight className="h-8 w-8" />
              </div>
            </div>

            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Transfert effectué</h3>
              <p className="text-gray-600 mb-6">
                Votre argent est envoyé et le destinataire reçoit une notification de réception
              </p>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <div className="text-sm font-medium text-green-600">Transfert réussi!</div>
                  <div className="text-xs text-gray-500 mt-1">Référence: GIC123456789</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/transfer" className="btn-primary text-lg px-8 py-4 inline-flex items-center">
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tarifs transparents
            </h2>
            <p className="text-xl text-gray-600">
              Pas de frais cachés, des taux compétitifs
            </p>
          </div>

          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Frais fixes pour tous les transferts</h3>
            <div className="text-6xl font-bold mb-4">5€</div>
            <p className="text-xl opacity-90 mb-8">Quel que soit le montant envoyé</p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 rounded-lg p-6">
                <div className="text-2xl font-bold">100€</div>
                <div className="text-sm opacity-75">Frais: 5€ (5%)</div>
              </div>
              <div className="bg-white/20 rounded-lg p-6 border-2 border-white/30">
                <div className="text-2xl font-bold">500€</div>
                <div className="text-sm opacity-75">Frais: 5€ (1%)</div>
                <div className="text-xs mt-2 bg-secondary-400 px-2 py-1 rounded">Populaire</div>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="text-2xl font-bold">1000€</div>
                <div className="text-sm opacity-75">Frais: 5€ (0.5%)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à envoyer de l'argent ?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Rejoignez des milliers de clients qui font confiance à GIC CashTransfer
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/transfer" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center">
              Commencer un transfert
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/track" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors">
              Suivre un transfert
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Image src="/logo.png" alt="GIC Logo" width={32} height={32} />
                <div>
                  <h3 className="font-bold">GIC CashTransfer</h3>
                  <p className="text-sm text-gray-400">GIC Promote LTD</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Solution de transfert d'argent international simple, rapide et sécurisée.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/transfer" className="hover:text-white transition-colors">Nouveau transfert</Link></li>
                <li><Link href="/track" className="hover:text-white transition-colors">Suivre un transfert</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support client</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Presse</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partenaires</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4" />
                  <span>support@gicpromoteltd.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4" />
                  <span>+33 1 23 45 67 89</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4" />
                  <span>Paris, France</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 GIC Promote LTD. Tous droits réservés.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Conditions d'utilisation</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Politique de confidentialité</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Mentions légales</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
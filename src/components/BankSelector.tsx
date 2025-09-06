'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search, Building2 } from 'lucide-react'

interface Bank {
  id: number
  code: string
  name: string
}

interface BankSelectorProps {
  countryId: string // ID du pays de réception pour récupérer les banques Flutterwave
  value: string
  onChange: (bankCode: string, bankName: string) => void
  error?: string
  disabled?: boolean
}

export default function BankSelector({ countryId, value, onChange, error, disabled }: BankSelectorProps) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)

  useEffect(() => {
    if (countryId) {
      fetchBanks()
    }
  }, [countryId])

  const fetchBanks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/flutterwave/banks?countryId=${countryId}`)
      if (response.ok) {
        const data = await response.json()
        setBanks(Array.isArray(data) ? data : [])
      } else {
        setBanks([])
      }
    } catch (error) {
      console.error('Error fetching banks:', error)
      setBanks([])
    } finally {
      setLoading(false)
    }
  }

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank)
    onChange(bank.code, bank.name)
    setIsOpen(false)
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
        <span className="text-gray-500 text-sm">Chargement des banques...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || banks.length === 0}
        className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between transition-all ${
          error 
            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
        } ${
          disabled || banks.length === 0 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'bg-white hover:border-purple-400'
        }`}
      >
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
          <span className={selectedBank ? 'text-gray-900' : 'text-gray-500'}>
            {selectedBank ? selectedBank.name : banks.length === 0 ? 'Aucune banque disponible' : 'Sélectionner une banque *'}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && banks.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une banque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredBanks.length > 0 ? (
              filteredBanks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleBankSelect(bank)}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-purple-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">{bank.name}</div>
                      <div className="text-xs text-gray-500">Code: {bank.code}</div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                Aucune banque trouvée
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Phone, ChevronDown } from 'lucide-react'

interface Country {
  id: string
  name: string
  code: string
  currency: string
  currencyCode: string
  flag: string
  region: string
  callingCode: string
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  countries: Country[]
  placeholder?: string
  error?: string
  label?: string
  required?: boolean
}

export default function PhoneInput({ 
  value, 
  onChange, 
  countries, 
  placeholder = "123 456 789",
  error,
  label = "Téléphone",
  required = false
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      setSelectedCountry(countries[0])
    }
  }, [countries, selectedCountry])

  // Réinitialiser le pays sélectionné si la liste des pays change
  useEffect(() => {
    if (countries.length === 0) {
      setSelectedCountry(null)
    } else if (selectedCountry && !countries.find(c => c.id === selectedCountry.id)) {
      setSelectedCountry(countries[0])
    }
  }, [countries, selectedCountry])

  useEffect(() => {
    if (value && value.includes(' ')) {
      const [code, ...numberParts] = value.split(' ')
      const number = numberParts.join(' ')
      setPhoneNumber(number)
      
      const country = countries.find(c => c.callingCode === code.replace('+', ''))
      if (country) {
        setSelectedCountry(country)
      }
    }
  }, [value, countries])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setIsOpen(false)
    const fullNumber = `+${country.callingCode} ${phoneNumber}`
    onChange(fullNumber)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value
    setPhoneNumber(number)
    if (selectedCountry) {
      const fullNumber = `+${selectedCountry.callingCode} ${number}`
      onChange(fullNumber)
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
        <Phone className="h-4 w-4 mr-2 text-gray-500" />
        {label} {required && '*'}
      </label>
      
      <div className="flex">
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => countries.length > 0 && setIsOpen(!isOpen)}
            disabled={countries.length === 0}
            className={`flex items-center px-3 py-3 border border-r-0 border-gray-200 rounded-l-xl bg-white/80 backdrop-blur-sm transition-all duration-200 ${
              countries.length === 0 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }`}
          >
            {selectedCountry ? (
              <>
                <img 
                  src={selectedCountry.flag} 
                  alt={`${selectedCountry.name} flag`}
                  className="w-6 h-4 object-cover rounded border mr-2"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-flag.png'
                  }}
                />
                <span className="text-sm font-medium">+{selectedCountry.callingCode}</span>
              </>
            ) : (
              <span className="text-sm text-gray-400">Code</span>
            )}
            <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
          </button>

          {isOpen && countries.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                >
                  <img 
                    src={country.flag} 
                    alt={`${country.name} flag`}
                    className="w-6 h-4 object-cover rounded border mr-3"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-flag.svg'
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{country.name}</div>
                    <div className="text-sm text-gray-500">+{country.callingCode}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={countries.length === 0 ? "Sélectionnez d'abord une région" : placeholder}
          disabled={countries.length === 0 || !selectedCountry}
          className={`flex-1 px-4 py-3 border border-gray-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm ${
            countries.length === 0 || !selectedCountry ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm flex items-center mt-1">
          <Phone className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
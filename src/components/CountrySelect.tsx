'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

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

interface CountrySelectProps {
  countries: Country[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
}

export default function CountrySelect({ 
  countries, 
  value, 
  onChange, 
  placeholder = "Sélectionner un pays",
  disabled = false,
  error 
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedCountry = countries.find(c => c.id === value)
  
  const filteredCountries = countries.filter(country => {
    if (!country || typeof country.name !== 'string' || typeof country.code !== 'string') {
      return false
    }
    return country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           country.code.toLowerCase().includes(searchTerm.toLowerCase())
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (country: Country) => {
    onChange(country.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-left flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
        } ${error ? 'border-red-300' : 'border-gray-200'}`}
      >
        <div className="flex items-center space-x-3">
          {selectedCountry ? (
            <>
              <img 
                src={selectedCountry.flag} 
                alt={`${selectedCountry.name} flag`}
                className="w-6 h-4 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-flag.svg'
                }}
              />
              <span className="font-medium text-gray-900">
                {selectedCountry.name}
              </span>
              <span className="text-sm text-gray-500">
                ({selectedCountry.currencyCode})
              </span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher un pays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                    value === country.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <img 
                    src={country.flag} 
                    alt={`${country.name} flag`}
                    className="w-6 h-4 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-flag.svg'
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{country.name}</div>
                    <div className="text-sm text-gray-500">{country.code} • {country.currencyCode}</div>
                  </div>
                  {value === country.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                Aucun pays trouvé
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
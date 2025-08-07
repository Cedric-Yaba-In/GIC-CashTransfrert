'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Globe } from 'lucide-react'

interface Region {
  id: number
  name: string
  code: string
  active: boolean
}

interface RegionSelectProps {
  regions: Region[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
}

export default function RegionSelect({ 
  regions, 
  value, 
  onChange, 
  placeholder = "Sélectionner une région",
  disabled = false,
  error 
}: RegionSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedRegion = regions.find(r => r.name.toLowerCase() === value.toLowerCase())
  
  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const handleSelect = (region: Region) => {
    onChange(region.name.toLowerCase())
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3371] focus:border-transparent transition-all duration-200 bg-white text-left flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
        } ${error ? 'border-red-300' : 'border-gray-200'}`}
      >
        <div className="flex items-center space-x-3">
          {selectedRegion ? (
            <>
              <div className="w-6 h-6 bg-[#0B3371]/10 rounded-full flex items-center justify-center">
                <Globe className="w-4 h-4 text-[#0B3371]" />
              </div>
              <span className="font-medium text-gray-900">
                {selectedRegion.name}
              </span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Rechercher une région..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3371] focus:border-transparent text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredRegions.length > 0 ? (
              filteredRegions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleSelect(region)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                    value.toLowerCase() === region.name.toLowerCase() ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <div className="w-6 h-6 bg-[#0B3371]/10 rounded-full flex items-center justify-center">
                    <Globe className="w-4 h-4 text-[#0B3371]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{region.name}</div>
                    <div className="text-sm text-gray-500">{region.code}</div>
                  </div>
                  {value.toLowerCase() === region.name.toLowerCase() && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                Aucune région trouvée
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
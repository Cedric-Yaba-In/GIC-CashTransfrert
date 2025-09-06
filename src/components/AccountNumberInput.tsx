'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'

interface AccountNumberInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
}

export default function AccountNumberInput({ 
  value, 
  onChange, 
  placeholder = "Numéro de compte", 
  error, 
  disabled 
}: AccountNumberInputProps) {
  const [focused, setFocused] = useState(false)

  const formatAccountNumber = (input: string): string => {
    // Supprimer tous les caractères non numériques
    const cleaned = input.replace(/\D/g, '')
    
    // Formater par groupes de 4 chiffres
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
    
    return formatted
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const formatted = formatAccountNumber(input)
    
    // Limiter à 20 chiffres maximum (5 groupes de 4)
    if (formatted.replace(/\s/g, '').length <= 20) {
      onChange(formatted)
    }
  }

  const getRawValue = () => value.replace(/\s/g, '')

  return (
    <div className="relative">
      <div className="relative">
        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all font-mono tracking-wider ${
            error 
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
          } ${
            disabled 
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
              : 'bg-white'
          }`}
        />
        {getRawValue().length > 0 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
            {getRawValue().length} chiffres
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {focused && getRawValue().length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          Format: {getRawValue().length < 10 ? 'Trop court' : getRawValue().length > 20 ? 'Trop long' : 'Valide'}
        </div>
      )}
    </div>
  )
}
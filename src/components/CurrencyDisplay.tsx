'use client'

import { useState, useEffect } from 'react'

interface CurrencyDisplayProps {
  amount: number
  fromCurrency: string
  toCurrency: string
  showBoth?: boolean
  className?: string
}

export default function CurrencyDisplay({
  amount,
  fromCurrency,
  toCurrency,
  showBoth = false,
  className = ''
}: CurrencyDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number>(amount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount)
      return
    }

    const convertAmount = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/exchange-rates?from=${fromCurrency}&to=${toCurrency}`)
        const data = await response.json()
        
        if (data.rate) {
          setConvertedAmount(amount * data.rate)
        }
      } catch (error) {
        console.error('Erreur conversion:', error)
        setConvertedAmount(amount)
      } finally {
        setLoading(false)
      }
    }

    convertAmount()
  }, [amount, fromCurrency, toCurrency])

  if (loading) {
    return <span className={className}>...</span>
  }

  if (showBoth && fromCurrency !== toCurrency) {
    return (
      <span className={className}>
        {amount.toFixed(2)} {fromCurrency} ≈ {convertedAmount.toFixed(2)} {toCurrency}
      </span>
    )
  }

  return (
    <span className={className}>
      {convertedAmount.toFixed(2)} {toCurrency}
    </span>
  )
}
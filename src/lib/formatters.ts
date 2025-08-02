export function formatAmount(amount: number | string, currency?: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) return '0'
  
  // Formater avec séparateurs de milliers et 2 décimales
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
  
  return currency ? `${formatted} ${currency}` : formatted
}
import axios from 'axios'

export interface CountryData {
  name: { common: string; official: string }
  cca2: string
  currencies: Record<string, { name: string; symbol: string }>
  flags: { png: string; svg: string }
}

export async function fetchCountryData(countryCode?: string): Promise<CountryData[]> {
  try {
    const url = countryCode 
      ? `https://restcountries.com/v3.1/alpha/${countryCode}`
      : 'https://restcountries.com/v3.1/all?fields=name,cca2,currencies,flags'
    
    const response = await axios.get(url)
    return Array.isArray(response.data) ? response.data : [response.data]
  } catch (error) {
    console.error('Error fetching country data:', error)
    return []
  }
}

export function formatCountryForDB(countryData: CountryData) {
  const currency = Object.values(countryData.currencies)[0]
  
  return {
    name: countryData.name.common,
    code: countryData.cca2,
    currency: currency?.name || '',
    currencyCode: Object.keys(countryData.currencies)[0] || '',
    flag: countryData.flags.svg,
  }
}
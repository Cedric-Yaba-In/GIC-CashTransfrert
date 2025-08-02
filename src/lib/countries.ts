import axios from 'axios'

export interface CountryData {
  name: { common: string; official: string }
  cca2: string
  currencies: Record<string, { name: string; symbol: string }>
  flags: { png: string; svg: string }
  region: string
  subregion: string
  idd: { root: string; suffixes: string[] }
}

export interface RegionData {
  name: string
  code: string
  countries: string[]
}

export async function fetchAllCountries(): Promise<CountryData[]> {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2,currencies,flags,region,subregion,idd')
    return response.data
  } catch (error) {
    console.error('Error fetching countries:', error)
    return []
  }
}

export async function fetchCountryData(countryCode?: string): Promise<CountryData[]> {
  try {
    const url = countryCode 
      ? `https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,cca2,currencies,flags,region,subregion,idd`
      : 'https://restcountries.com/v3.1/all?fields=name,cca2,currencies,flags,region,subregion,idd'
    
    const response = await axios.get(url)
    return Array.isArray(response.data) ? response.data : [response.data]
  } catch (error) {
    console.error('Error fetching country data:', error)
    return []
  }
}

export async function fetchCountriesByRegion(region: string): Promise<CountryData[]> {
  try {
    const response = await axios.get(`https://restcountries.com/v3.1/region/${region}?fields=name,cca2,currencies,flags,region,subregion,idd`)
    return response.data
  } catch (error) {
    console.error('Error fetching countries by region:', error)
    return []
  }
}

export function getRegionsFromCountries(countries: CountryData[]): RegionData[] {
  const regionsMap = new Map<string, Set<string>>()
  
  countries.forEach(country => {
    if (country.region) {
      if (!regionsMap.has(country.region)) {
        regionsMap.set(country.region, new Set())
      }
      regionsMap.get(country.region)!.add(country.cca2)
    }
  })
  
  return Array.from(regionsMap.entries()).map(([name, countryCodes]) => ({
    name,
    code: name.toLowerCase().replace(/\s+/g, '-'),
    countries: Array.from(countryCodes)
  }))
}

export function formatCountryForDB(countryData: CountryData) {
  const currency = Object.values(countryData.currencies)[0]
  const callingCode = countryData.idd?.root + (countryData.idd?.suffixes?.[0] || '')
  
  return {
    name: countryData.name.common,
    code: countryData.cca2,
    currency: currency?.name || '',
    currencyCode: Object.keys(countryData.currencies)[0] || '',
    flag: countryData.flags.svg,
    region: countryData.region,
    callingCode: callingCode || '',
  }
}
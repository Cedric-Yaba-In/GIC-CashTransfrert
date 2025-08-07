// Données de banques populaires avec logos pour différents pays
export const bankSeeds = [
  // France
  {
    name: 'BNP Paribas',
    code: 'BNPPARIBAS',
    countryCode: 'FR',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/BNP-Paribas-Logo.png',
    website: 'https://www.bnpparibas.fr',
    swiftCode: 'BNPAFRPP',
    source: 'MANUAL'
  },
  {
    name: 'Crédit Agricole',
    code: 'CREDITAGRICOLE',
    countryCode: 'FR',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Credit-Agricole-Logo.png',
    website: 'https://www.credit-agricole.fr',
    swiftCode: 'AGRIFRPP',
    source: 'MANUAL'
  },
  {
    name: 'Société Générale',
    code: 'SOCIETEGENERALE',
    countryCode: 'FR',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Societe-Generale-Logo.png',
    website: 'https://www.societegenerale.fr',
    swiftCode: 'SOGEFRPP',
    source: 'MANUAL'
  },
  
  // États-Unis
  {
    name: 'JPMorgan Chase',
    code: 'CHASE',
    countryCode: 'US',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/JPMorgan-Chase-Logo.png',
    website: 'https://www.chase.com',
    swiftCode: 'CHASUS33',
    routingNumber: '021000021',
    source: 'MANUAL'
  },
  {
    name: 'Bank of America',
    code: 'BOA',
    countryCode: 'US',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Bank-of-America-Logo.png',
    website: 'https://www.bankofamerica.com',
    swiftCode: 'BOFAUS3N',
    routingNumber: '011000138',
    source: 'MANUAL'
  },
  
  // Royaume-Uni
  {
    name: 'Barclays',
    code: 'BARCLAYS',
    countryCode: 'GB',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Barclays-Logo.png',
    website: 'https://www.barclays.co.uk',
    swiftCode: 'BARCGB22',
    source: 'MANUAL'
  },
  {
    name: 'HSBC UK',
    code: 'HSBC',
    countryCode: 'GB',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/HSBC-Logo.png',
    website: 'https://www.hsbc.co.uk',
    swiftCode: 'HBUKGB4B',
    source: 'MANUAL'
  },
  
  // Allemagne
  {
    name: 'Deutsche Bank',
    code: 'DEUTSCHEBANK',
    countryCode: 'DE',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Deutsche-Bank-Logo.png',
    website: 'https://www.deutsche-bank.de',
    swiftCode: 'DEUTDEFF',
    source: 'MANUAL'
  },
  
  // Canada
  {
    name: 'Royal Bank of Canada',
    code: 'RBC',
    countryCode: 'CA',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/RBC-Logo.png',
    website: 'https://www.rbc.com',
    swiftCode: 'ROYCCAT2',
    source: 'MANUAL'
  },
  
  // Australie
  {
    name: 'Commonwealth Bank',
    code: 'CBA',
    countryCode: 'AU',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Commonwealth-Bank-Logo.png',
    website: 'https://www.commbank.com.au',
    swiftCode: 'CTBAAU2S',
    source: 'MANUAL'
  },
  
  // Sénégal
  {
    name: 'Banque de l\'Habitat du Sénégal',
    code: 'BHS',
    countryCode: 'SN',
    logo: 'https://www.bhs.sn/images/logo.png',
    website: 'https://www.bhs.sn',
    swiftCode: 'BHSNSNDX',
    source: 'MANUAL'
  },
  {
    name: 'Société Générale Sénégal',
    code: 'SGSN',
    countryCode: 'SN',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Societe-Generale-Logo.png',
    website: 'https://www.societegenerale.sn',
    swiftCode: 'SOGESNDX',
    source: 'MANUAL'
  },
  {
    name: 'Ecobank Sénégal',
    code: 'ECOSN',
    countryCode: 'SN',
    logo: 'https://ecobank.com/uploads/logos/ecobank-logo.png',
    website: 'https://ecobank.com',
    swiftCode: 'ECOSNSNDX',
    source: 'MANUAL'
  },
  {
    name: 'CBAO Groupe Attijariwafa Bank',
    code: 'CBAO',
    countryCode: 'SN',
    logo: 'https://www.cbao.sn/images/logo.png',
    website: 'https://www.cbao.sn',
    swiftCode: 'CBAOSNDX',
    source: 'MANUAL'
  },

  // Côte d'Ivoire
  {
    name: 'Société Générale Côte d\'Ivoire',
    code: 'SGCI',
    countryCode: 'CI',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Societe-Generale-Logo.png',
    website: 'https://www.societegenerale.ci',
    swiftCode: 'SOGECIDX',
    source: 'MANUAL'
  },
  {
    name: 'Ecobank Côte d\'Ivoire',
    code: 'ECOCI',
    countryCode: 'CI',
    logo: 'https://ecobank.com/uploads/logos/ecobank-logo.png',
    website: 'https://ecobank.com',
    swiftCode: 'ECOCIDX',
    source: 'MANUAL'
  },
  {
    name: 'Banque Atlantique Côte d\'Ivoire',
    code: 'BACI',
    countryCode: 'CI',
    logo: 'https://www.banqueatlantique.net/images/logo.png',
    website: 'https://www.banqueatlantique.net',
    swiftCode: 'ATBKCIDX',
    source: 'MANUAL'
  },
  {
    name: 'UBA Côte d\'Ivoire',
    code: 'UBACI',
    countryCode: 'CI',
    logo: 'https://www.ubagroup.com/images/uba-logo.png',
    website: 'https://www.ubagroup.com',
    swiftCode: 'UNAFCIDX',
    source: 'MANUAL'
  },

  // Cameroun
  {
    name: 'Afriland First Bank',
    code: 'AFRILAND',
    countryCode: 'CM',
    logo: 'https://www.afrilandfirstbank.com/images/logo.png',
    website: 'https://www.afrilandfirstbank.com',
    swiftCode: 'CCBKCMCX',
    source: 'MANUAL'
  },
  {
    name: 'Banque Atlantique Cameroun',
    code: 'BACM',
    countryCode: 'CM',
    logo: 'https://www.banqueatlantique.net/images/logo.png',
    website: 'https://www.banqueatlantique.net',
    swiftCode: 'ATBKCMCX',
    source: 'MANUAL'
  },
  {
    name: 'Commercial Bank of Cameroon',
    code: 'CBC',
    countryCode: 'CM',
    logo: 'https://www.cbccameroon.com/images/logo.png',
    website: 'https://www.cbccameroon.com',
    swiftCode: 'CBCMCMCX',
    source: 'MANUAL'
  },
  {
    name: 'Ecobank Cameroun',
    code: 'ECOBANK',
    countryCode: 'CM',
    logo: 'https://ecobank.com/uploads/logos/ecobank-logo.png',
    website: 'https://ecobank.com',
    swiftCode: 'ECOCCMCX',
    source: 'MANUAL'
  },
  {
    name: 'Standard Chartered Bank Cameroon',
    code: 'SCB',
    countryCode: 'CM',
    logo: 'https://av.sc.com/corp-en/content/images/scb-logo.png',
    website: 'https://www.sc.com/cm',
    swiftCode: 'SCBLCMCX',
    source: 'MANUAL'
  },
  {
    name: 'United Bank for Africa Cameroon',
    code: 'UBA',
    countryCode: 'CM',
    logo: 'https://www.ubagroup.com/images/uba-logo.png',
    website: 'https://www.ubagroup.com',
    swiftCode: 'UNAFCMCX',
    source: 'MANUAL'
  },
  {
    name: 'Société Générale Cameroun',
    code: 'SGCM',
    countryCode: 'CM',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Societe-Generale-Logo.png',
    website: 'https://www.societegenerale.cm',
    swiftCode: 'SOGECMCX',
    source: 'MANUAL'
  }
]
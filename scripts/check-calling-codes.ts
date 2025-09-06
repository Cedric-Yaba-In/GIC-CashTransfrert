import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping des codes pays vers les indicatifs téléphoniques
const CALLING_CODES: Record<string, string> = {
  'CM': '237', // Cameroun
  'CI': '225', // Côte d'Ivoire
  'SN': '221', // Sénégal
  'BF': '226', // Burkina Faso
  'ML': '223', // Mali
  'NE': '227', // Niger
  'TD': '235', // Tchad
  'CF': '236', // République Centrafricaine
  'CG': '242', // Congo
  'GA': '241', // Gabon
  'GQ': '240', // Guinée Équatoriale
  'NG': '234', // Nigeria
  'GH': '233', // Ghana
  'TG': '228', // Togo
  'BJ': '229', // Bénin
  'FR': '33',  // France
  'US': '1',   // États-Unis
  'CA': '1',   // Canada
  'GB': '44',  // Royaume-Uni
  'DE': '49',  // Allemagne
  'IT': '39',  // Italie
  'ES': '34',  // Espagne
  'KE': '254', // Kenya
  'UG': '256', // Ouganda
  'TZ': '255', // Tanzanie
  'RW': '250', // Rwanda
  'ET': '251', // Éthiopie
  'ZA': '27',  // Afrique du Sud
  'EG': '20',  // Égypte
  'MA': '212', // Maroc
  'DZ': '213', // Algérie
  'TN': '216', // Tunisie
}

async function checkAndUpdateCallingCodes() {
  try {
    console.log('🔍 Vérification des indicatifs téléphoniques...')

    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        callingCode: true
      }
    })

    console.log(`📊 ${countries.length} pays trouvés`)

    let updatedCount = 0
    let missingCount = 0

    for (const country of countries) {
      if (!country.callingCode && CALLING_CODES[country.code]) {
        // Mettre à jour le callingCode manquant
        await prisma.country.update({
          where: { id: country.id },
          data: { callingCode: CALLING_CODES[country.code] }
        })
        
        console.log(`✅ ${country.name} (${country.code}): +${CALLING_CODES[country.code]}`)
        updatedCount++
      } else if (!country.callingCode) {
        console.log(`❌ ${country.name} (${country.code}): Indicatif manquant`)
        missingCount++
      } else {
        console.log(`✓ ${country.name} (${country.code}): +${country.callingCode}`)
      }
    }

    console.log('\n📈 Résumé:')
    console.log(`- Pays mis à jour: ${updatedCount}`)
    console.log(`- Pays sans indicatif: ${missingCount}`)
    console.log(`- Total vérifié: ${countries.length}`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  checkAndUpdateCallingCodes()
}

export { checkAndUpdateCallingCodes }
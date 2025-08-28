import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cinetPayService } from '@/lib/cinetpay'

export async function POST(
  request: Request,
  { params }: { params: { countryId: string } }
) {
  try {
    const countryId = parseInt(params.countryId)
    
    if (!countryId) {
      return NextResponse.json({ error: 'Country ID invalide' }, { status: 400 })
    }

    // Récupérer le pays
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    })

    if (!country) {
      return NextResponse.json({ error: 'Pays non trouvé' }, { status: 404 })
    }

    // Récupérer le sous-wallet CinetPay pour ce pays
    const cinetpaySubWallet = await prisma.subWallet.findFirst({
      where: {
        countryPaymentMethod: {
          countryId: countryId,
          paymentMethod: {
            type: 'CINETPAY'
          }
        }
      },
      include: {
        countryPaymentMethod: {
          include: {
            paymentMethod: true
          }
        },
        wallet: true
      }
    })

    if (!cinetpaySubWallet) {
      return NextResponse.json({ 
        error: 'Aucun portefeuille CinetPay trouvé pour ce pays' 
      }, { status: 404 })
    }

    // Récupérer le solde réel depuis l'API CinetPay (pas local)
    console.log(`Fetching real balance from CinetPay API for ${country.name} (${country.currencyCode})`)
    const apiBalance = await cinetPayService.getBalance(country.currencyCode)
    
    if (apiBalance === null) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de récupérer le solde depuis l\'API CinetPay',
        details: 'Vérifiez la configuration CinetPay (API_KEY, API_PASSWORD) et la connectivité internet'
      }, { status: 500 })
    }
    
    console.log(`CinetPay API returned real balance: ${apiBalance} ${country.currencyCode} (not local data)`)
    const newBalance = apiBalance
    
    // Mettre à jour le solde du sous-wallet
    const oldBalance = cinetpaySubWallet.balance.toNumber()
    await prisma.subWallet.update({
      where: { id: cinetpaySubWallet.id },
      data: { balance: newBalance }
    })
    
    console.log(`CinetPay balance updated for ${country.name}: ${oldBalance} → ${newBalance} ${country.currencyCode}`)

    // Recalculer le solde total du wallet principal
    const wallet = await prisma.wallet.findUnique({
      where: { id: cinetpaySubWallet.walletId },
      include: { subWallets: true }
    })

    if (wallet) {
      const totalBalance = wallet.subWallets.reduce((sum, sw) => {
        return sum + sw.balance.toNumber()
      }, 0)

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: totalBalance }
      })
    }

    return NextResponse.json({
      success: true,
      country: country.name,
      currency: country.currencyCode,
      oldBalance,
      newBalance,
      balanceChange: newBalance - oldBalance,
      message: `Solde CinetPay synchronisé pour ${country.name}: ${oldBalance} → ${newBalance} ${country.currencyCode}`
    })

  } catch (error) {
    console.error('CinetPay sync error for country:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la synchronisation CinetPay'
    }, { status: 500 })
  }
}
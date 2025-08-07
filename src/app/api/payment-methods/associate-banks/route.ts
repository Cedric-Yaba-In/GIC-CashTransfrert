import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { bankId, countryId, accountName, accountNumber, iban, swiftCode, routingNumber, branchCode } = await request.json()

    if (!bankId || !countryId || !accountName || !accountNumber) {
      return NextResponse.json(
        { error: 'bankId, countryId, accountName et accountNumber sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que le pays existe
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    })

    if (!country) {
      return NextResponse.json(
        { error: 'Pays non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que la banque existe et appartient au bon pays
    const bank = await prisma.bank.findFirst({
      where: {
        id: bankId,
        countryCode: country.code
      }
    })

    if (!bank) {
      return NextResponse.json(
        { error: 'Banque invalide ou n\'appartient pas au pays sélectionné' },
        { status: 400 }
      )
    }

    // Vérifier s'il existe déjà une méthode BANK_TRANSFER de base pour ce pays
    let baseMethod = await prisma.paymentMethod.findFirst({
      where: {
        type: 'BANK_TRANSFER',
        bank: null,
        countries: {
          some: {
            countryId: countryId
          }
        }
      },
      include: {
        countries: true
      }
    })

    // Si aucune méthode de base n'existe, la créer
    if (!baseMethod) {
      baseMethod = await prisma.paymentMethod.create({
        data: {
          name: `Virement bancaire ${country.code}`,
          type: 'BANK_TRANSFER',
          category: 'BANK_TRANSFER',
          minAmount: 1000,
          maxAmount: 10000000,
          active: true,
          countries: {
            create: {
              countryId: countryId
            }
          }
        },
        include: {
          countries: true
        }
      })
    }

    // Créer le compte bancaire
    const bankAccount = await prisma.bankAccount.upsert({
      where: {
        bankId_countryId: {
          bankId,
          countryId
        }
      },
      update: {
        accountName,
        accountNumber,
        iban: iban || null,
        swiftCode: swiftCode || null,
        routingNumber: routingNumber || null,
        branchCode: branchCode || null
      },
      create: {
        bankId,
        countryId,
        accountName,
        accountNumber,
        iban: iban || null,
        swiftCode: swiftCode || null,
        routingNumber: routingNumber || null,
        branchCode: branchCode || null
      }
    })

    // S'assurer que le wallet principal du pays existe
    const wallet = await prisma.wallet.upsert({
      where: {
        countryId: countryId
      },
      update: {},
      create: {
        countryId: countryId,
        balance: 0,
        active: true
      }
    })

    // Vérifier si cette banque n'est pas déjà associée
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        type: 'BANK_TRANSFER',
        bank: {
          id: bankId
        },
        countries: {
          some: {
            countryId: countryId
          }
        }
      }
    })

    let method
    if (!existingMethod) {
      method = await prisma.paymentMethod.create({
        data: {
          name: `${bank.name} - ${country.code}`,
          type: 'BANK_TRANSFER',
          category: 'BANK_TRANSFER',
          minAmount: 1000,
          maxAmount: 10000000,
          active: true,
          bank: {
            connect: {
              id: bankId
            }
          },
          countries: {
            create: {
              countryId: countryId
            }
          }
        },
        include: {
          countries: true,
          bank: true
        }
      })

      // Créer le sous-wallet pour ce compte bancaire
      const countryPaymentMethod = method.countries[0]
      if (countryPaymentMethod) {
        await prisma.subWallet.create({
          data: {
            walletId: wallet.id,
            countryPaymentMethodId: countryPaymentMethod.id,
            bankId: bankId,
            accountNumber: accountNumber,
            accountName: accountName,
            balance: 0,
            active: true,
            readOnly: false
          }
        })
      }
    } else {
      method = existingMethod
      
      // Vérifier si le sous-wallet existe déjà, sinon le créer
      const countryPaymentMethod = await prisma.countryPaymentMethod.findFirst({
        where: {
          paymentMethodId: method.id,
          countryId: countryId
        }
      })
      
      if (countryPaymentMethod) {
        const existingSubWallet = await prisma.subWallet.findUnique({
          where: {
            countryPaymentMethodId: countryPaymentMethod.id
          }
        })
        
        if (!existingSubWallet) {
          await prisma.subWallet.create({
            data: {
              walletId: wallet.id,
              countryPaymentMethodId: countryPaymentMethod.id,
              bankId: bankId,
              accountNumber: accountNumber,
              accountName: accountName,
              balance: 0,
              active: true,
              readOnly: false
            }
          })
        } else {
          // Mettre à jour les informations du sous-wallet
          await prisma.subWallet.update({
            where: {
              id: existingSubWallet.id
            },
            data: {
              accountNumber: accountNumber,
              accountName: accountName,
              active: true
            }
          })
        }
      }
    }

    return NextResponse.json({
      message: 'Banque associée avec succès',
      method,
      bankAccount
    })

  } catch (error) {
    console.error('Erreur lors de l\'association des banques:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
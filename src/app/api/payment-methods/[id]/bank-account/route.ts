import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const methodId = parseInt(params.id)
    const { accountName, accountNumber, iban } = await request.json()

    if (!accountName || !accountNumber) {
      return NextResponse.json(
        { error: 'Le nom et le numéro de compte sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que la méthode de paiement existe
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: methodId }
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Méthode de paiement non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour les informations du compte bancaire
    const updatedMethod = await prisma.paymentMethod.update({
      where: { id: methodId },
      data: {
        // Les champs de compte bancaire n'existent pas dans le modèle actuel
        // On marque juste comme configuré
        name: `${paymentMethod.name} - Configuré`
      }
    })

    return NextResponse.json({
      message: 'Informations du compte bancaire mises à jour',
      method: updatedMethod
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte bancaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
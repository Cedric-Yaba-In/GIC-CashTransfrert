import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateNumericId, sanitizeInput, sanitizeForLog } from '@/lib/security'

// Fonction pour générer des messages d'erreur descriptifs
function getTransferErrorMessage(error: string): { title: string; description: string } {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('ip whitelisting') || errorLower.includes('ip_whitelisting')) {
    return {
      title: 'Configuration IP requise',
      description: 'L\'adresse IP du serveur doit être ajoutée à la liste blanche Flutterwave. Contactez l\'administrateur technique.'
    }
  }
  
  if (errorLower.includes('insufficient') || errorLower.includes('balance')) {
    return {
      title: 'Solde insuffisant',
      description: 'Le solde Flutterwave est insuffisant pour effectuer ce transfert. Vérifiez le solde du compte.'
    }
  }
  
  if (errorLower.includes('invalid account') || errorLower.includes('account not found')) {
    return {
      title: 'Compte destinataire invalide',
      description: 'Le numéro de compte ou les informations du destinataire sont incorrects. Vérifiez les détails du bénéficiaire.'
    }
  }
  
  if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('connection')) {
    return {
      title: 'Problème de connexion',
      description: 'Impossible de se connecter à Flutterwave. Vérifiez la connexion internet et réessayez.'
    }
  }
  
  if (errorLower.includes('unauthorized') || errorLower.includes('authentication')) {
    return {
      title: 'Erreur d\'authentification',
      description: 'Les clés API Flutterwave sont invalides ou expirées. Vérifiez la configuration.'
    }
  }
  
  if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
    return {
      title: 'Limite de requêtes atteinte',
      description: 'Trop de requêtes envoyées à Flutterwave. Attendez quelques minutes avant de réessayer.'
    }
  }
  
  if (errorLower.includes('currency') || errorLower.includes('exchange')) {
    return {
      title: 'Problème de devise',
      description: 'La devise spécifiée n\'est pas supportée ou il y a un problème de taux de change.'
    }
  }
  
  if (errorLower.includes('amount') || errorLower.includes('limit')) {
    return {
      title: 'Montant invalide',
      description: 'Le montant du transfert dépasse les limites autorisées ou est en dessous du minimum requis.'
    }
  }
  
  // Message générique pour les erreurs non reconnues
  return {
    title: 'Erreur de transfert',
    description: `Le transfert automatique a échoué: ${error}. Contactez le support technique si le problème persiste.`
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const transactionId = validateNumericId(params.id)
    console.log('Updating transaction:', transactionId)
    if (!transactionId) {
      return NextResponse.json({ error: 'ID transaction invalide' }, { status: 400 })
    }

    const body = await request.json()
    console.log('Update request body:', body)
    
    const { status, adminNotes } = body
    
    // Récupérer la transaction actuelle pour préserver les notes existantes
    const currentTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })
    
    if (!currentTransaction) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 })
    }
    
    // Fusionner les notes existantes avec les nouvelles
    let mergedNotes = {}
    try {
      mergedNotes = JSON.parse(currentTransaction.adminNotes || '{}')
    } catch (e) {
      console.error('Error parsing existing admin notes:', e)
    }
    
    if (adminNotes) {
      try {
        const newNotes = typeof adminNotes === 'string' ? JSON.parse(adminNotes) : adminNotes
        mergedNotes = { ...mergedNotes, ...newNotes, lastUpdatedBy: 'admin', lastUpdatedAt: new Date().toISOString() }
      } catch (e) {
        console.error('Error parsing new admin notes:', e)
      }
    }
    
    const updateData = { 
      status: sanitizeInput(status) as any, 
      adminNotes: JSON.stringify(mergedNotes),
      updatedAt: new Date()
    }
    
    console.log('Update data:', updateData)
    
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        senderCountry: true,
        receiverCountry: true,
        senderPaymentMethod: true,
        receiverPaymentMethod: true,
      }
    })

    // Si la transaction est approuvée, déclencher le transfert automatique selon le moyen de réception
    if (status === 'APPROVED') {
      try {
        let transferResult: { success: boolean; error?: string } = { success: false, error: 'Méthode non supportée' }
        
        if (transaction.receiverPaymentMethod?.type === 'FLUTTERWAVE') {
          const { flutterwaveService } = await import('@/lib/flutterwave')
          transferResult = await flutterwaveService.processTransferToReceiver(transactionId)
          console.log('Flutterwave transfer result:', transferResult)
        } else if (transaction.receiverPaymentMethod?.type === 'CINETPAY') {
          const { cinetPayService } = await import('@/lib/cinetpay')
          transferResult = await cinetPayService.processTransferToReceiver(transactionId)
          console.log('CinetPay transfer result:', transferResult)
        }
        
        if (transferResult.success) {
          console.log('Automatic transfer completed successfully')
          // Le statut APPROVED est déjà défini, on garde la transaction mise à jour
        } else {
          console.error('Automatic transfer failed:', transferResult.error)
          
          // Si le transfert automatique échoue, revenir au statut PAID avec l'erreur
          const currentNotes = JSON.parse(transaction.adminNotes || '{}')
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: 'PAID', // Revenir au statut PAID
              adminNotes: JSON.stringify({
                ...currentNotes,
                automaticTransferError: transferResult.error,
                requiresManualTransfer: true,
                errorTimestamp: new Date().toISOString(),
                approvalAttempted: true
              })
            }
          })
          
          // Retourner la transaction avec le statut PAID et l'erreur
          const updatedTransaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
              senderCountry: true,
              receiverCountry: true,
              senderPaymentMethod: true,
              receiverPaymentMethod: true,
            }
          })
          
          const errorMessage = getTransferErrorMessage(transferResult.error || 'Erreur inconnue')
          
          return NextResponse.json({
            error: errorMessage.title,
            details: errorMessage.description,
            originalError: transferResult.error,
            transaction: updatedTransaction
          }, { status: 400 })
        }
      } catch (transferError) {
        console.error('Error during automatic transfer:', transferError)
        
        // En cas d'erreur critique, revenir au statut PAID
        const currentNotes = JSON.parse(transaction.adminNotes || '{}')
        const errorMessage = transferError instanceof Error ? transferError.message : String(transferError)
        
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'PAID', // Revenir au statut PAID
            adminNotes: JSON.stringify({
              ...currentNotes,
              criticalTransferError: errorMessage,
              requiresManualTransfer: true,
              errorTimestamp: new Date().toISOString(),
              approvalAttempted: true
            })
          }
        })
        
        // Retourner la transaction avec le statut PAID et l'erreur
        const updatedTransaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
          include: {
            senderCountry: true,
            receiverCountry: true,
            senderPaymentMethod: true,
            receiverPaymentMethod: true,
          }
        })
        
        const errorInfo = getTransferErrorMessage(errorMessage)
        
        return NextResponse.json({
          error: errorInfo.title,
          details: errorInfo.description,
          originalError: errorMessage,
          transaction: updatedTransaction
        }, { status: 500 })
      }
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Transaction update error:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Erreur de mise à jour de la transaction' }, { status: 500 })
  }
}
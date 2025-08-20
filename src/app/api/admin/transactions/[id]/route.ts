import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateNumericId, sanitizeInput, sanitizeForLog } from '@/lib/security'

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
      status: sanitizeInput(status), 
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

    // Si la transaction est approuvée et que le moyen de réception est Flutterwave, déclencher le transfert
    if (status === 'APPROVED' && transaction.receiverPaymentMethod?.type === 'FLUTTERWAVE') {
      try {
        const { flutterwaveService } = await import('@/lib/flutterwave')
        const transferResult = await flutterwaveService.processTransferToReceiver(transactionId)
        
        if (transferResult.success) {
          console.log('Automatic Flutterwave transfer completed')
        } else {
          console.error('Automatic transfer failed:', transferResult.error)
          
          // Si le transfert automatique échoue, mettre à jour les notes avec l'erreur
          // mais garder le statut APPROVED pour traitement manuel
          const currentNotes = JSON.parse(transaction.adminNotes || '{}')
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              adminNotes: JSON.stringify({
                ...currentNotes,
                automaticTransferError: transferResult.error,
                requiresManualTransfer: true,
                errorTimestamp: new Date().toISOString()
              })
            }
          })
        }
      } catch (transferError) {
        console.error('Error during automatic transfer:', transferError)
        
        // En cas d'erreur critique, mettre à jour les notes
        const currentNotes = JSON.parse(transaction.adminNotes || '{}')
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            adminNotes: JSON.stringify({
              ...currentNotes,
              criticalTransferError: transferError.message,
              requiresManualTransfer: true,
              errorTimestamp: new Date().toISOString()
            })
          }
        })
      }
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Transaction update error:', sanitizeForLog(error))
    return NextResponse.json({ error: 'Erreur de mise à jour de la transaction' }, { status: 500 })
  }
}
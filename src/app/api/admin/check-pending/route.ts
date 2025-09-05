import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { flutterwaveService } from '@/lib/flutterwave'
import { sanitizeForLog } from '@/lib/security'

export async function POST() {
  try {
    console.log('Checking pending transactions...')
    
    // Récupérer toutes les transactions en attente depuis plus de 10 minutes
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        }
      },
      include: {
        senderPaymentMethod: true,
        senderCountry: true
      }
    })

    console.log(`Found ${pendingTransactions.length} pending transactions`)

    let updatedCount = 0

    for (const transaction of pendingTransactions) {
      try {
        // Si c'est une transaction Flutterwave, essayer de vérifier le statut
        if (transaction.senderPaymentMethod?.type === 'FLUTTERWAVE' && transaction.flutterwaveRef) {
          console.log(`Checking Flutterwave status for transaction ${transaction.id}`)
          
          const verification = await flutterwaveService.verifyPayment(transaction.senderCountryId, transaction.flutterwaveRef)
          
          if (verification && verification.status === 'success') {
            const paymentStatus = verification.data?.status
            
            if (paymentStatus === 'successful') {
              // Paiement réussi
              await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                  status: 'PAID',
                  paidAt: new Date(),
                  adminNotes: JSON.stringify({
                    ...JSON.parse(transaction.adminNotes || '{}'),
                    autoVerified: true,
                    verificationDate: new Date().toISOString()
                  })
                }
              })
              updatedCount++
              console.log(`Transaction ${transaction.id} marked as PAID`)
            } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
              // Paiement échoué ou annulé
              await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                  status: paymentStatus === 'cancelled' ? 'CANCELLED' : 'FAILED',
                  adminNotes: JSON.stringify({
                    ...JSON.parse(transaction.adminNotes || '{}'),
                    autoVerified: true,
                    verificationDate: new Date().toISOString(),
                    flutterwaveStatus: paymentStatus
                  })
                }
              })
              updatedCount++
              console.log(`Transaction ${transaction.id} marked as ${paymentStatus.toUpperCase()}`)
            }
          }
        } else {
          // Pour les transactions non-Flutterwave en attente depuis plus de 30 minutes, les marquer comme expirées
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
          if (transaction.createdAt < thirtyMinutesAgo) {
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: {
                status: 'FAILED',
                adminNotes: JSON.stringify({
                  ...JSON.parse(transaction.adminNotes || '{}'),
                  autoExpired: true,
                  expirationDate: new Date().toISOString(),
                  reason: 'Transaction expired after 30 minutes'
                })
              }
            })
            updatedCount++
            console.log(`Transaction ${transaction.id} marked as expired`)
          }
        }
      } catch (error) {
        console.error(`Error checking transaction ${transaction.id}:`, sanitizeForLog(error))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${pendingTransactions.length} transactions, updated ${updatedCount}`,
      checkedCount: pendingTransactions.length,
      updatedCount
    })

  } catch (error) {
    console.error('Error checking pending transactions:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
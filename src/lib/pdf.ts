import jsPDF from 'jspdf'

export function generateInvoicePDF(transaction: any) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text('GIC CashTransfer', 20, 30)
  doc.setFontSize(12)
  doc.text('GIC Promote LTD', 20, 40)
  
  // Invoice title
  doc.setFontSize(16)
  doc.text('Facture de transfert', 20, 60)
  
  // Transaction details
  doc.setFontSize(12)
  doc.text(`Référence: ${transaction.reference}`, 20, 80)
  doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString('fr-FR')}`, 20, 90)
  doc.text(`Statut: ${transaction.status}`, 20, 100)
  
  // Sender info
  doc.text('Expéditeur:', 20, 120)
  doc.text(`Nom: ${transaction.senderName}`, 30, 130)
  doc.text(`Email: ${transaction.senderEmail}`, 30, 140)
  doc.text(`Pays: ${transaction.senderCountry.name}`, 30, 150)
  
  // Receiver info
  doc.text('Destinataire:', 20, 170)
  doc.text(`Nom: ${transaction.receiverName}`, 30, 180)
  doc.text(`Pays: ${transaction.receiverCountry.name}`, 30, 190)
  
  // Amount details
  doc.text('Détails du montant:', 20, 210)
  doc.text(`Montant: ${transaction.amount} ${transaction.senderCountry.currencyCode}`, 30, 220)
  doc.text(`Frais: ${transaction.fees} ${transaction.senderCountry.currencyCode}`, 30, 230)
  doc.text(`Total: ${transaction.totalAmount} ${transaction.senderCountry.currencyCode}`, 30, 240)
  
  // Footer
  doc.setFontSize(10)
  doc.text('© 2024 GIC Promote LTD. Tous droits réservés.', 20, 280)
  
  return doc.output('blob')
}

export async function sendInvoiceByEmail(transaction: any, email: string) {
  const pdfBlob = generateInvoicePDF(transaction)
  
  // Convert blob to base64 for email attachment
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      
      try {
        const response = await fetch('/api/send-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            transactionReference: transaction.reference,
            pdfData: base64
          })
        })
        
        if (response.ok) {
          resolve(true)
        } else {
          reject(new Error('Failed to send invoice'))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(pdfBlob)
  })
}
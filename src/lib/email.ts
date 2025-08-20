import nodemailer from 'nodemailer'
import { ConfigService } from './config'

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null

  private static async getTransporter() {
    if (!this.transporter) {
      const emailConfig = await ConfigService.getEmailConfig()
      
      this.transporter = nodemailer.createTransporter({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.port === 465,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass
        }
      })
    }
    return this.transporter
  }

  static async sendTransactionConfirmation(transaction: any) {
    try {
      const transporter = await this.getTransporter()
      const emailConfig = await ConfigService.getEmailConfig()
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center; }
            .logo { color: white; font-size: 24px; font-weight: bold; }
            .content { padding: 30px; }
            .status { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; }
            .details { background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .footer { background: #1f2937; color: white; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">GIC CashTransfer</div>
              <p style="color: white; margin: 10px 0 0 0;">Transfert d'argent international</p>
            </div>
            
            <div class="content">
              <h2>Paiement confirmé !</h2>
              <div class="status">✓ Transaction payée</div>
              
              <div class="details">
                <h3>Détails de votre transfert</h3>
                <p><strong>Référence :</strong> ${transaction.reference}</p>
                <p><strong>Montant envoyé :</strong> ${transaction.amount} ${transaction.senderCountry?.currencyCode}</p>
                <p><strong>Montant reçu :</strong> ${transaction.receivedAmount || 'En cours de calcul'} ${transaction.receiverCountry?.currencyCode}</p>
                <p><strong>Destinataire :</strong> ${transaction.receiverName}</p>
                <p><strong>Pays de destination :</strong> ${transaction.receiverCountry?.name}</p>
                <p><strong>Date :</strong> ${new Date(transaction.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              
              <p>Votre transfert est maintenant en cours de traitement. Vous recevrez une notification dès que le destinataire aura reçu les fonds.</p>
              
              <p>Vous pouvez suivre votre transfert à tout moment : <a href="${process.env.NEXT_PUBLIC_APP_URL}/track/${transaction.reference}">Suivre mon transfert</a></p>
            </div>
            
            <div class="footer">
              <p>© 2024 GIC Promote LTD - Tous droits réservés</p>
              <p>Support : support@gicpromoteltd.com</p>
            </div>
          </div>
        </body>
        </html>
      `

      await transporter.sendMail({
        from: emailConfig.from || emailConfig.user,
        to: transaction.senderEmail,
        subject: `Paiement confirmé - Transfert ${transaction.reference}`,
        html
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending confirmation email:', error)
      return { success: false, error: error.message }
    }
  }

  static async sendReceiverNotification(transaction: any) {
    try {
      if (!transaction.receiverEmail) return { success: false, error: 'No receiver email' }

      const transporter = await this.getTransporter()
      const emailConfig = await ConfigService.getEmailConfig()
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
            .logo { color: white; font-size: 24px; font-weight: bold; }
            .content { padding: 30px; }
            .status { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; }
            .details { background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { background: #1f2937; color: white; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">GIC CashTransfer</div>
              <p style="color: white; margin: 10px 0 0 0;">Vous avez reçu un transfert !</p>
            </div>
            
            <div class="content">
              <h2>Bonjour ${transaction.receiverName},</h2>
              <div class="status">💰 Transfert en cours</div>
              
              <div class="details">
                <h3>Détails du transfert</h3>
                <p><strong>De :</strong> ${transaction.senderName}</p>
                <p><strong>Montant :</strong> ${transaction.receivedAmount || 'En cours de calcul'} ${transaction.receiverCountry?.currencyCode}</p>
                <p><strong>Référence :</strong> ${transaction.reference}</p>
                <p><strong>Date :</strong> ${new Date(transaction.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              
              <p>Un transfert d'argent a été initié en votre faveur. Les fonds seront disponibles dès validation par notre équipe.</p>
              
              <p>Vous pouvez suivre ce transfert : <a href="${process.env.NEXT_PUBLIC_APP_URL}/track/${transaction.reference}">Suivre le transfert</a></p>
            </div>
            
            <div class="footer">
              <p>© 2024 GIC Promote LTD - Tous droits réservés</p>
              <p>Support : support@gicpromoteltd.com</p>
            </div>
          </div>
        </body>
        </html>
      `

      await transporter.sendMail({
        from: emailConfig.from || emailConfig.user,
        to: transaction.receiverEmail,
        subject: `Transfert reçu de ${transaction.senderName} - ${transaction.reference}`,
        html
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending receiver notification:', error)
      return { success: false, error: error.message }
    }
  }
}
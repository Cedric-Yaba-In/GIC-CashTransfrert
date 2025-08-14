import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Sanitisation des entrées utilisateur
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // Supprime les balises HTML de base
    .replace(/javascript:/gi, '') // Supprime les protocoles javascript
    .replace(/on\w+=/gi, '') // Supprime les handlers d'événements
    .replace(/[\r\n]/g, ' ') // Remplace les retours à la ligne par des espaces
    .trim()
}

// Sanitisation pour les logs
export function sanitizeForLog(input: any): string {
  if (typeof input !== 'string') {
    input = JSON.stringify(input)
  }
  
  return input
    .replace(/[\r\n\t]/g, ' ') // Remplace les caractères de contrôle
    .replace(/\x00/g, '') // Supprime les caractères null
    .substring(0, 1000) // Limite la longueur
}

// Validation des IDs numériques
export function validateNumericId(id: string | undefined): number | null {
  if (!id) return null
  const numId = parseInt(id, 10)
  return isNaN(numId) || numId <= 0 ? null : numId
}

// Validation des paramètres de requête
export function validateQueryParam(param: string | string[] | undefined): string {
  if (!param) return ''
  if (Array.isArray(param)) param = param[0]
  return sanitizeInput(param)
}

// Génération de token CSRF
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Validation de token CSRF
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  )
}

// Validation d'email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validation de montant
export function validateAmount(amount: any): number | null {
  const num = parseFloat(amount)
  return isNaN(num) || num <= 0 ? null : num
}

// Échappement HTML pour l'affichage
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
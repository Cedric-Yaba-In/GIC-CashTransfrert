import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, validateCSRFToken } from './security'

const CSRF_HEADER = 'x-csrf-token'
const CSRF_COOKIE = 'csrf-token'

export function generateCSRFResponse(): NextResponse {
  const token = generateCSRFToken()
  const response = NextResponse.json({ csrfToken: token })
  
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 heure
  })
  
  return response
}

export function validateCSRFRequest(request: NextRequest): boolean {
  const method = request.method
  
  // GET, HEAD, OPTIONS ne nécessitent pas de protection CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true
  }
  
  const token = request.headers.get(CSRF_HEADER)
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value
  
  if (!token || !cookieToken) {
    return false
  }
  
  return validateCSRFToken(token, cookieToken)
}

export function createCSRFError(): NextResponse {
  return NextResponse.json(
    { error: 'CSRF token invalide' },
    { status: 403 }
  )
}
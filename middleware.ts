import { NextRequest, NextResponse } from 'next/server'
import { validateCSRFRequest, createCSRFError } from './src/lib/csrf'

export function middleware(request: NextRequest) {
  // Skip CSRF validation for GET requests and specific paths
  if (request.method === 'GET' || 
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/csrf-token') ||
      request.nextUrl.pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Validate CSRF for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    if (!validateCSRFRequest(request)) {
      return createCSRFError()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
import { NextRequest } from 'next/server'
import { generateCSRFResponse } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  return generateCSRFResponse()
}
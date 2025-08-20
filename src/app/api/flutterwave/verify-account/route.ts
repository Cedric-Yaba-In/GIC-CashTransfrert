import { NextRequest, NextResponse } from 'next/server'
import { flutterwaveService } from '@/lib/flutterwave'
import { sanitizeForLog, sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountNumber, bankCode } = body

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: 'Account number and bank code are required' },
        { status: 400 }
      )
    }

    const sanitizedAccountNumber = sanitizeInput(accountNumber)
    const sanitizedBankCode = sanitizeInput(bankCode)

    // Vérifier le compte via Flutterwave
    const accountInfo = await flutterwaveService.verifyAccountNumber(
      sanitizedAccountNumber,
      sanitizedBankCode
    )
    
    if (accountInfo) {
      return NextResponse.json({
        status: 'success',
        data: {
          accountNumber: accountInfo.account_number,
          accountName: accountInfo.account_name,
          bankName: accountInfo.bank_name
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Account verification failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error verifying account:', sanitizeForLog(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
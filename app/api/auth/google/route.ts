import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-drive'

export async function GET() {
  const url = getAuthUrl()
  return NextResponse.redirect(url)
}

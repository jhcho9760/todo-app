import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/google-drive'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    return NextResponse.json({
      message: '아래 refresh_token을 복사해서 Vercel 환경변수 GOOGLE_REFRESH_TOKEN에 저장하세요.',
      refresh_token: tokens.refresh_token,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

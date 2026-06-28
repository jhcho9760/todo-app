import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

async function getPin(user: string): Promise<string> {
  const key = `pin_${user}`
  const config = await prisma.appConfig.findUnique({ where: { key } })
  return config?.value ?? '0000'
}

// POST: 로그인 (PIN 검증)
export async function POST(request: NextRequest) {
  const { user, pin } = await request.json()
  if (!user || !pin) return NextResponse.json({ ok: false }, { status: 400 })
  const stored = await getPin(user)
  return NextResponse.json({ ok: stored === pin })
}

// PUT: PIN 변경
export async function PUT(request: NextRequest) {
  const { user, currentPin, newPin } = await request.json()
  if (!user || !currentPin || !newPin) return NextResponse.json({ ok: false }, { status: 400 })
  const stored = await getPin(user)
  if (stored !== currentPin) return NextResponse.json({ ok: false, error: '현재 PIN이 틀렸습니다' }, { status: 401 })
  const key = `pin_${user}`
  await prisma.appConfig.upsert({ where: { key }, update: { value: newPin }, create: { key, value: newPin } })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 공개 키 반환
export async function GET() {
  return NextResponse.json({ publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY })
}

// 구독 저장
export async function POST(request: NextRequest) {
  const { user, subscription } = await request.json()
  if (!user || !subscription) return NextResponse.json({ ok: false }, { status: 400 })

  const { endpoint, keys } = subscription
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { user, p256dh: keys.p256dh, auth: keys.auth },
    create: { user, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  })
  return NextResponse.json({ ok: true })
}

// 구독 삭제
export async function DELETE(request: NextRequest) {
  const { endpoint } = await request.json()
  await prisma.pushSubscription.delete({ where: { endpoint } }).catch(() => {})
  return NextResponse.json({ ok: true })
}

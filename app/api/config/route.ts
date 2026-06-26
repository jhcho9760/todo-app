import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const configs = await prisma.appConfig.findMany()
  const result: Record<string, string> = {}
  for (const c of configs) result[c.key] = c.value
  return NextResponse.json(result)
}

export async function PUT(request: NextRequest) {
  const body: Record<string, string> = await request.json()
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.appConfig.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  )
  return NextResponse.json({ ok: true })
}

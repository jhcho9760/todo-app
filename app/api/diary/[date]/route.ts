import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const entry = await prisma.diaryEntry.findUnique({ where: { date } })
  return NextResponse.json(entry ?? null)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const { content, mood } = await request.json()

  const entry = await prisma.diaryEntry.upsert({
    where: { date },
    update: { content: content ?? '', mood: mood ?? null },
    create: { date, content: content ?? '', mood: mood ?? null },
  })

  return NextResponse.json(entry)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  await prisma.diaryEntry.delete({ where: { date } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

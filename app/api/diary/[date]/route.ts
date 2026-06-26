import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const entry = await prisma.diaryEntry.findUnique({ where: { date } })
  if (!entry) return NextResponse.json(null)
  return NextResponse.json({ ...entry, photos: JSON.parse(entry.photos) })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const { title, content, mood, photos } = await request.json()

  const photosJson = photos !== undefined ? JSON.stringify(photos) : undefined

  const entry = await prisma.diaryEntry.upsert({
    where: { date },
    update: {
      title: title ?? '',
      content: content ?? '',
      mood: mood ?? null,
      ...(photosJson !== undefined && { photos: photosJson }),
    },
    create: { date, title: title ?? '', content: content ?? '', mood: mood ?? null, photos: photosJson ?? '[]' },
  })

  return NextResponse.json({ ...entry, photos: JSON.parse(entry.photos) })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  await prisma.diaryEntry.delete({ where: { date } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

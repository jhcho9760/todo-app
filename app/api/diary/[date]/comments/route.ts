import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params
  const comments = await prisma.diaryComment.findMany({
    where: { diaryDate: date },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(comments)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params
  const { content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'empty' }, { status: 400 })
  const comment = await prisma.diaryComment.create({
    data: { diaryDate: date, content: content.trim() },
  })
  return NextResponse.json(comment)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params
  const { id } = await request.json()
  await prisma.diaryComment.delete({ where: { id: Number(id), diaryDate: date } })
  return NextResponse.json({ ok: true })
}

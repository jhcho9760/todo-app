import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const items = await prisma.wishlistItem.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const { title, category, memo } = await request.json()
  if (!title?.trim() || !category) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const item = await prisma.wishlistItem.create({ data: { title: title.trim(), category, memo: memo ?? '' } })
  return NextResponse.json(item)
}

export async function PATCH(request: NextRequest) {
  const { id, completed, title, memo } = await request.json()
  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (memo !== undefined) data.memo = memo
  if (completed !== undefined) {
    data.completed = completed
    data.completedAt = completed
      ? new Date().toISOString().slice(0, 10)
      : null
  }
  const item = await prisma.wishlistItem.update({ where: { id: Number(id) }, data })
  return NextResponse.json(item)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  await prisma.wishlistItem.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}

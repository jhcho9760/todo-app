import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPush, otherUser, userLabel } from '@/lib/push'

export async function GET() {
  const items = await prisma.wishlistItem.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const { title, category, memo, actor } = await request.json()
  if (!title?.trim() || !category) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const item = await prisma.wishlistItem.create({ data: { title: title.trim(), category, memo: memo ?? '' } })
  if (actor) {
    sendPush(otherUser(actor), `${userLabel(actor)}이 우리 리스트에 추가했어요 🌟`, title.trim()).catch(() => {})
  }
  return NextResponse.json(item)
}

export async function PATCH(request: NextRequest) {
  const { id, completed, title, category, memo, actor } = await request.json()
  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (category !== undefined) data.category = category
  if (memo !== undefined) data.memo = memo
  if (completed !== undefined) {
    data.completed = completed
    data.completedAt = completed
      ? new Date().toISOString().slice(0, 10)
      : null
  }
  const item = await prisma.wishlistItem.update({ where: { id: Number(id) }, data })
  if (actor && completed === true) {
    sendPush(otherUser(actor), `${userLabel(actor)}이 우리 리스트를 완료했어요 🎉`, item.title).catch(() => {})
  }
  return NextResponse.json(item)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  await prisma.wishlistItem.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}

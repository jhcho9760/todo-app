import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const items = await prisma.anniversary.findMany({ orderBy: { date: 'asc' } })
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const { name, date, emoji } = await request.json()
  if (!name?.trim() || !date) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const item = await prisma.anniversary.create({ data: { name: name.trim(), date, emoji: emoji ?? '🎉' } })
  return NextResponse.json(item)
}

export async function PATCH(request: NextRequest) {
  const { id, name, date, emoji } = await request.json()
  const item = await prisma.anniversary.update({ where: { id: Number(id) }, data: { name, date, emoji } })
  return NextResponse.json(item)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  await prisma.anniversary.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}

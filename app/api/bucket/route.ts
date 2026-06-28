import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const items = await prisma.bucketItem.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const { title } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'empty' }, { status: 400 })
  const item = await prisma.bucketItem.create({ data: { title: title.trim() } })
  return NextResponse.json(item)
}

export async function PATCH(request: NextRequest) {
  const { id, completed } = await request.json()
  const item = await prisma.bucketItem.update({ where: { id: Number(id) }, data: { completed } })
  return NextResponse.json(item)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  await prisma.bucketItem.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}

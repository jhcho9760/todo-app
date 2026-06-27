import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, lat, lng, memo, visitedAt } = await request.json()
  const place = await prisma.datePlace.update({
    where: { id: Number(id) },
    data: { name, lat: Number(lat), lng: Number(lng), memo: memo ?? '', visitedAt: visitedAt ?? null },
  })
  return NextResponse.json(place)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.datePlace.delete({ where: { id: Number(id) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; placeId: string }> }
) {
  const { placeId } = await params
  const { name, memo, visitedAt, photoData } = await request.json()
  const place = await prisma.tripPlace.update({
    where: { id: Number(placeId) },
    data: {
      ...(name !== undefined && { name }),
      ...(memo !== undefined && { memo }),
      ...(visitedAt !== undefined && { visitedAt: visitedAt ?? null }),
      ...(photoData !== undefined && { photoData: photoData ?? null }),
    },
  })
  return NextResponse.json(place)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; placeId: string }> }
) {
  const { placeId } = await params
  await prisma.tripPlace.delete({ where: { id: Number(placeId) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

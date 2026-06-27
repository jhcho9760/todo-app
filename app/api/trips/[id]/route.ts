import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name, startDate, endDate, memo, coverPlaceId } = await request.json()
  const trip = await prisma.trip.update({
    where: { id: Number(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate: endDate ?? null }),
      ...(memo !== undefined && { memo }),
      ...(coverPlaceId !== undefined && { coverPlaceId: coverPlaceId ?? null }),
    },
  })
  return NextResponse.json(trip)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.trip.delete({ where: { id: Number(id) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

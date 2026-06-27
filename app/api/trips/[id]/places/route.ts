import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const places = await prisma.tripPlace.findMany({
    where: { tripId: Number(id) },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(places)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name, lat, lng, memo, visitedAt, photoData } = await request.json()
  const place = await prisma.tripPlace.create({
    data: {
      tripId: Number(id),
      name,
      lat: Number(lat),
      lng: Number(lng),
      memo: memo ?? '',
      visitedAt: visitedAt ?? null,
      photoData: photoData ?? null,
    },
  })
  return NextResponse.json(place)
}

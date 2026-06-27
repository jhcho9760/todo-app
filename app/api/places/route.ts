import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const places = await prisma.datePlace.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(places)
}

export async function POST(request: NextRequest) {
  const { name, lat, lng, memo, visitedAt } = await request.json()
  const place = await prisma.datePlace.create({
    data: { name, lat: Number(lat), lng: Number(lng), memo: memo ?? '', visitedAt: visitedAt ?? null },
  })
  return NextResponse.json(place)
}

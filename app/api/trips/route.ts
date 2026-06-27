import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const trips = await prisma.trip.findMany({
    orderBy: { startDate: 'desc' },
    include: { places: true },
  })
  return NextResponse.json(trips)
}

export async function POST(request: NextRequest) {
  const { name, startDate, endDate, memo } = await request.json()
  const trip = await prisma.trip.create({
    data: { name, startDate, endDate: endDate ?? null, memo: memo ?? '' },
    include: { places: true },
  })
  return NextResponse.json(trip)
}

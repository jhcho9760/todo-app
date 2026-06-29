import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const items = await prisma.tripChecklist.findMany({
    where: { tripId: Number(id) },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(items)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { category, text } = await request.json()
  const item = await prisma.tripChecklist.create({
    data: { tripId: Number(id), category, text },
  })
  return NextResponse.json(item)
}

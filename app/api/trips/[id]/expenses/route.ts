import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const items = await prisma.tripExpense.findMany({
    where: { tripId: Number(id) },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  })
  return NextResponse.json(items)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { date, name, amount } = await request.json()
  const item = await prisma.tripExpense.create({
    data: { tripId: Number(id), date, name, amount: Number(amount) },
  })
  return NextResponse.json(item)
}

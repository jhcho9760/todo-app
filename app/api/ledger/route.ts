import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const month = searchParams.get('month')

  if (month) {
    const entries = await prisma.ledgerEntry.findMany({
      where: { date: { startsWith: month } },
      select: { date: true, amount: true, paidBy: true },
    })
    const byDate: Record<string, number> = {}
    const byPerson: Record<string, number> = {}
    for (const e of entries) {
      byDate[e.date] = (byDate[e.date] ?? 0) + e.amount
      byPerson[e.paidBy] = (byPerson[e.paidBy] ?? 0) + e.amount
    }
    return NextResponse.json({
      byDate: Object.entries(byDate).map(([date, total]) => ({ date, total })),
      byPerson,
    })
  }

  if (date) {
    const entries = await prisma.ledgerEntry.findMany({
      where: { date },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(entries)
  }

  return NextResponse.json([])
}

export async function POST(request: NextRequest) {
  const { date, label, amount, category, paidBy } = await request.json()
  const entry = await prisma.ledgerEntry.create({
    data: { date, label, amount: Number(amount), category, paidBy },
  })
  return NextResponse.json(entry)
}

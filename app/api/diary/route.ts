import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // YYYY-MM

  const entries = await prisma.diaryEntry.findMany({
    where: month ? { date: { startsWith: month } } : undefined,
    select: { date: true, mood: true, content: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(entries)
}

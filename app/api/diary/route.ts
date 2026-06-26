import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // YYYY-MM
  const all = searchParams.get('all')

  if (all) {
    const entries = await prisma.diaryEntry.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(
      entries.map((e) => ({ ...e, photos: JSON.parse(e.photos) }))
    )
  }

  const entries = await prisma.diaryEntry.findMany({
    where: month ? { date: { startsWith: month } } : undefined,
    select: { date: true, mood: true, title: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(entries)
}

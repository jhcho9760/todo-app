import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const entries = await prisma.diaryEntry.findMany({
    where: { NOT: { photos: '[]' } },
    select: { date: true, title: true, photos: true },
    orderBy: { date: 'desc' },
  })

  const result = entries
    .map((e) => {
      let photos: string[] = []
      try { photos = JSON.parse(e.photos) } catch { /* ignore */ }
      return { date: e.date, title: e.title, photos }
    })
    .filter((e) => e.photos.length > 0)

  return NextResponse.json(result)
}

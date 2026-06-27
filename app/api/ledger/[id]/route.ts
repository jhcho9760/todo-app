import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.ledgerEntry.delete({ where: { id: Number(id) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

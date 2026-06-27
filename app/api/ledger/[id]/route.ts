import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { label, amount, category, paidBy } = await request.json()
  const entry = await prisma.ledgerEntry.update({
    where: { id: Number(id) },
    data: { label, amount: Number(amount), category, paidBy },
  })
  return NextResponse.json(entry)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.ledgerEntry.delete({ where: { id: Number(id) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

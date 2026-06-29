import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const { expenseId } = await params
  await prisma.tripExpense.delete({ where: { id: Number(expenseId) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

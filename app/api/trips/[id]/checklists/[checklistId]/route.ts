import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  const { checklistId } = await params
  const { checked, text } = await request.json()
  const item = await prisma.tripChecklist.update({
    where: { id: Number(checklistId) },
    data: {
      ...(checked !== undefined && { checked }),
      ...(text !== undefined && { text }),
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  const { checklistId } = await params
  await prisma.tripChecklist.delete({ where: { id: Number(checklistId) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

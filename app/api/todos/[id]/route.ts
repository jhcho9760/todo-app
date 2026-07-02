import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UpdateTodoInput } from '@/types/todo'
import { sendPush, otherUser, userLabel } from '@/lib/push'
import { normalizeTodoDates } from '@/lib/calendar'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  const body: UpdateTodoInput & { actor?: string } = await request.json()

  // 날짜 필드가 포함된 수정이면 시작일/종료일을 함께 정규화
  const hasDateUpdate = body.startDate !== undefined || body.dueDate !== undefined
  const normalized = hasDateUpdate
    ? normalizeTodoDates(body.startDate, body.dueDate)
    : null

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(normalized && {
        startDate: normalized.startDate,
        dueDate: normalized.dueDate,
      }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
    },
  })

  if (body.actor && body.completed === true) {
    sendPush(otherUser(body.actor), `${userLabel(body.actor)}이 할 일을 완료했어요 ✅`, todo.title).catch(() => {})
  }

  return NextResponse.json({ ...todo, tags: JSON.parse(todo.tags) })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  await prisma.todo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

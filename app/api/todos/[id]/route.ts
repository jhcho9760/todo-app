import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UpdateTodoInput } from '@/types/todo'
import { sendPush, otherUser, userLabel } from '@/lib/push'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  const body: UpdateTodoInput & { actor?: string } = await request.json()

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.dueDate !== undefined && {
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UpdateTodoInput } from '@/types/todo'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  const body: UpdateTodoInput = await request.json()

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

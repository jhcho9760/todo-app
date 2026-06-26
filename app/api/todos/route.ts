import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateTodoInput } from '@/types/todo'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search    = searchParams.get('search') || ''
  const category  = searchParams.get('category') || ''
  const priority  = searchParams.get('priority') || ''
  const completed = searchParams.get('completed')
  const dateFrom  = searchParams.get('dateFrom')
  const dateTo    = searchParams.get('dateTo')
  const noDate    = searchParams.get('noDate')

  const todos = await prisma.todo.findMany({
    where: {
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(category && { category }),
      ...(priority && { priority }),
      ...(completed !== null && { completed: completed === 'true' }),
      ...(noDate === 'true'
        ? { dueDate: null }
        : {
            ...(dateFrom && { dueDate: { gte: new Date(dateFrom + 'T00:00:00Z') } }),
            ...(dateTo && { dueDate: { lte: new Date(dateTo + 'T23:59:59Z') } }),
          }),
    },
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json(
    todos.map((t) => ({ ...t, tags: JSON.parse(t.tags) }))
  )
}

export async function POST(request: NextRequest) {
  const body: CreateTodoInput = await request.json()

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const todo = await prisma.todo.create({
    data: {
      title: body.title.trim(),
      description: body.description ?? null,
      priority: body.priority ?? 'MEDIUM',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      category: body.category ?? null,
      tags: JSON.stringify(body.tags ?? []),
    },
  })

  return NextResponse.json({ ...todo, tags: JSON.parse(todo.tags) }, { status: 201 })
}

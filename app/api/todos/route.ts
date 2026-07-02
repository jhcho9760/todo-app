import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateTodoInput } from '@/types/todo'
import { sendPush, otherUser, userLabel } from '@/lib/push'
import { normalizeTodoDates } from '@/lib/calendar'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search    = searchParams.get('search') || ''
  const category  = searchParams.get('category') || ''
  const priority  = searchParams.get('priority') || ''
  const completed = searchParams.get('completed')
  const dateFrom  = searchParams.get('dateFrom')
  const dateTo    = searchParams.get('dateTo')
  const noDate    = searchParams.get('noDate')
  const owner     = searchParams.get('owner')

  const todos = await prisma.todo.findMany({
    where: {
      ...(owner && { owner }),
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
        : (dateFrom || dateTo)
          ? {
              OR: [
                // 하루짜리: dueDate가 범위 안
                {
                  startDate: null,
                  dueDate: {
                    ...(dateFrom && { gte: new Date(dateFrom + 'T00:00:00Z') }),
                    ...(dateTo && { lte: new Date(dateTo + 'T23:59:59Z') }),
                  },
                },
                // 기간: 시작<=to AND 종료>=from (범위와 겹침)
                {
                  startDate: {
                    not: null,
                    ...(dateTo && { lte: new Date(dateTo + 'T23:59:59Z') }),
                  },
                  ...(dateFrom && { dueDate: { gte: new Date(dateFrom + 'T00:00:00Z') } }),
                },
              ],
            }
          : {}),
    },
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json(
    todos.map((t) => ({ ...t, tags: JSON.parse(t.tags) }))
  )
}

export async function POST(request: NextRequest) {
  const body: CreateTodoInput & { actor?: string } = await request.json()

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const { startDate, dueDate } = normalizeTodoDates(body.startDate, body.dueDate)

  const todo = await prisma.todo.create({
    data: {
      title: body.title.trim(),
      description: body.description ?? null,
      priority: body.priority ?? 'MEDIUM',
      startDate,
      dueDate,
      category: body.category ?? null,
      tags: JSON.stringify(body.tags ?? []),
      owner: body.owner ?? 'nayun',
    },
  })

  if (body.actor) {
    sendPush(otherUser(body.actor), `${userLabel(body.actor)}이 할 일을 추가했어요 📝`, body.title.trim()).catch(() => {})
  }

  return NextResponse.json({ ...todo, tags: JSON.parse(todo.tags) }, { status: 201 })
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { useAuth } from '@/components/AuthProvider'
import { toDateStr } from '@/lib/calendar'
import CalendarMonthView from '@/components/CalendarMonthView'
import CalendarWeekView from '@/components/CalendarWeekView'
import CalendarDayView from '@/components/CalendarDayView'

type View = 'month' | 'week' | 'today' | 'tomorrow'

function parseDateParam(dateParam: string): Date {
  const [y, m, d] = dateParam.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getDateForView(view: View, dateParam: string | null): Date {
  if (dateParam) return parseDateParam(dateParam)
  if (view === 'tomorrow') {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
  }
  return new Date()
}

function getDateRange(view: View, date: Date): { dateFrom: string; dateTo: string } | null {
  if (view === 'today' || view === 'tomorrow') {
    const str = toDateStr(date)
    return { dateFrom: str, dateTo: str }
  }
  if (view === 'week') {
    const day = date.getDay()
    const sunday = new Date(date)
    sunday.setDate(date.getDate() - day)
    const saturday = new Date(sunday)
    saturday.setDate(sunday.getDate() + 6)
    return { dateFrom: toDateStr(sunday), dateTo: toDateStr(saturday) }
  }
  if (view === 'month') {
    const first = new Date(date.getFullYear(), date.getMonth(), 1)
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return { dateFrom: toDateStr(first), dateTo: toDateStr(last) }
  }
  return null
}

export default function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const view = (searchParams.get('view') ?? 'month') as View
  const dateParam = searchParams.get('date')
  const owner = searchParams.get('owner') ?? 'nayun'

  const [currentDate, setCurrentDate] = useState(() => getDateForView(view, dateParam))
  const [todos, setTodos] = useState<Todo[]>([])

  const fetchTodos = useCallback(async () => {
    const range = getDateRange(view, currentDate)
    const res = range
      ? await fetch(`/api/todos?dateFrom=${range.dateFrom}&dateTo=${range.dateTo}&owner=${owner}`)
      : { json: async () => [] } as unknown as Response
    const data = await res.json()
    setTodos(Array.isArray(data) ? data : [])
  }, [view, currentDate, owner])

  useEffect(() => {
    setCurrentDate(getDateForView(view, dateParam))
  }, [view, dateParam])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const handleCreate = async (data: CreateTodoInput) => {
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, owner, actor: user }),
    })
    fetchTodos()
  }

  const handleUpdate = async (id: number, data: UpdateTodoInput) => {
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, actor: user }),
    })
    fetchTodos()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    fetchTodos()
  }

  const handleDayClick = (dateStr: string) => {
    router.push(`/?view=today&owner=${owner}&date=${dateStr}`)
  }

  const ownerLabel = owner === 'junhyung' ? '준형' : '나윤'
  const headerTitle = view === 'today'
    ? (dateParam ? parseDateParam(dateParam).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : `${ownerLabel}의 오늘`)
    : view === 'tomorrow' ? `${ownerLabel}의 다음날`
    : view === 'week' ? `${ownerLabel}의 주간`
    : `${ownerLabel}의 월간`

  const allDone = todos.length > 0 && todos.every((t) => t.completed)

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6" style={{ paddingBottom: '80px' }}>
      {/* 참 잘했어요 배너 */}
      {allDone && (
        <div
          className="flex flex-col items-center justify-center py-5 mb-4 mt-4 rounded-[18px]"
          style={{ backgroundColor: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.3)' }}
        >
          <span style={{ fontSize: '36px', marginBottom: '6px' }}>🎉</span>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#34c759' }}>참 잘했어요!</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>할 일을 모두 완료했어요</p>
        </div>
      )}

      {/* 상단 헤더 */}
      <div className="px-1 pt-6 md:pt-10 pb-6 md:pb-8 mb-4 md:mb-6">
        <h1
          className="font-semibold"
          style={{ fontSize: '34px', lineHeight: '1.1', letterSpacing: '-0.28px', color: 'var(--text-primary)' }}
        >
          {headerTitle}
        </h1>
        <p
          className="mt-2 font-normal"
          style={{ fontSize: '15px', lineHeight: '1.47', letterSpacing: '-0.374px', color: allDone ? '#34c759' : '#0066cc' }}
        >
          {allDone ? '모두 완료! ✓' : `${todos.filter((t) => !t.completed).length}개 남음`}
        </p>
      </div>

      {view === 'month' && (
        <CalendarMonthView
          date={currentDate}
          todos={todos}
          onMonthChange={setCurrentDate}
          onDayClick={handleDayClick}
        />
      )}
      {view === 'week' && (
        <CalendarWeekView
          date={currentDate}
          todos={todos}
          onWeekChange={setCurrentDate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      )}
      {(view === 'today' || view === 'tomorrow') && (
        <CalendarDayView
          date={currentDate}
          todos={todos}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      )}
    </main>
  )
}

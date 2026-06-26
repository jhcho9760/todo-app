'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { toDateStr } from '@/lib/calendar'
import CalendarMonthView from '@/components/CalendarMonthView'
import CalendarWeekView from '@/components/CalendarWeekView'
import CalendarDayView from '@/components/CalendarDayView'

const VIEW_TABS = [
  { label: '오늘', view: 'today' },
  { label: '다음날', view: 'tomorrow' },
  { label: '주', view: 'week' },
  { label: '월', view: 'month' },
]

type View = 'month' | 'week' | 'today' | 'tomorrow'

function getDateForView(view: View, dateParam: string | null): Date {
  if (dateParam) return new Date(dateParam)
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

  const view = (searchParams.get('view') ?? 'month') as View
  const dateParam = searchParams.get('date')

  const [currentDate, setCurrentDate] = useState(() => getDateForView(view, dateParam))
  const [todos, setTodos] = useState<Todo[]>([])
  const [noDateTodos, setNoDateTodos] = useState<Todo[]>([])

  const fetchTodos = useCallback(async () => {
    const range = getDateRange(view, currentDate)

    const [rangeRes, noDateRes] = await Promise.all([
      range
        ? fetch(`/api/todos?dateFrom=${range.dateFrom}&dateTo=${range.dateTo}`)
        : Promise.resolve({ json: async () => [] } as unknown as Response),
      fetch('/api/todos?noDate=true'),
    ])

    const [rangeData, noDateData] = await Promise.all([
      rangeRes.json(),
      noDateRes.json(),
    ])

    setTodos(Array.isArray(rangeData) ? rangeData : [])
    setNoDateTodos(Array.isArray(noDateData) ? noDateData : [])
  }, [view, currentDate])

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
      body: JSON.stringify(data),
    })
    fetchTodos()
  }

  const handleUpdate = async (id: number, data: UpdateTodoInput) => {
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    fetchTodos()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    fetchTodos()
  }

  const handleDayClick = (dateStr: string) => {
    router.push(`/?view=today&date=${dateStr}`)
  }

  const headerTitle = view === 'today'
    ? (dateParam ? new Date(dateParam).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '오늘')
    : view === 'tomorrow' ? '다음날'
    : view === 'week' ? '주간'
    : '월간'

  return (
    <main className="max-w-3xl mx-auto px-6" style={{ paddingBottom: '80px' }}>
      {/* 다크 헤더 타일 */}
      <div
        className="mx-[-16px] px-8 pt-12 pb-10 mb-8"
        style={{ backgroundColor: '#1d1d1f' }}
      >
        <h1
          className="font-semibold"
          style={{ fontSize: '40px', lineHeight: '1.1', letterSpacing: '-0.28px', color: '#ffffff' }}
        >
          {headerTitle}
        </h1>
        <p
          className="mt-2 font-normal"
          style={{ fontSize: '17px', lineHeight: '1.47', letterSpacing: '-0.374px', color: '#2997ff' }}
        >
          {todos.filter((t) => !t.completed).length}개 남음
        </p>

        {/* 뷰 탭 */}
        <div className="flex gap-2 mt-6">
          {VIEW_TABS.map(({ label, view: v }) => (
            <Link
              key={v}
              href={`/?view=${v}`}
              className="px-4 py-1.5 rounded-full font-normal transition-colors"
              style={{
                fontSize: '14px',
                color: view === v ? '#ffffff' : 'rgba(255,255,255,0.5)',
                backgroundColor: view === v ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: '1px solid',
                borderColor: view === v ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <CalendarMonthView
          date={currentDate}
          todos={todos}
          noDateTodos={noDateTodos}
          onMonthChange={setCurrentDate}
          onDayClick={handleDayClick}
        />
      )}
      {view === 'week' && (
        <CalendarWeekView
          date={currentDate}
          todos={todos}
          noDateTodos={noDateTodos}
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
          noDateTodos={noDateTodos}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      )}
    </main>
  )
}

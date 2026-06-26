'use client'

import { useState } from 'react'
import { Todo } from '@/types/todo'
import { toDateStr, getMonthGrid, isSameDay, isToday } from '@/lib/calendar'
import CalendarHeader from './CalendarHeader'

interface Props {
  date: Date
  todos: Todo[]
  noDateTodos: Todo[]
  onMonthChange: (date: Date) => void
  onDayClick: (dateStr: string) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarMonthView({ date, todos, noDateTodos, onMonthChange, onDayClick }: Props) {
  const [showNoDate, setShowNoDate] = useState(false)
  const grid = getMonthGrid(date.getFullYear(), date.getMonth())
  const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`

  const handlePrev = () => {
    onMonthChange(new Date(date.getFullYear(), date.getMonth() - 1, 1))
  }

  const handleNext = () => {
    onMonthChange(new Date(date.getFullYear(), date.getMonth() + 1, 1))
  }

  const todosForDay = (day: Date) =>
    todos.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day))

  const isCurrentMonth = (day: Date) => day.getMonth() === date.getMonth()

  return (
    <div>
      <CalendarHeader label={label} onPrev={handlePrev} onNext={handleNext} />

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center py-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="overflow-hidden mb-4" style={{ border: '1px solid var(--border)', borderRadius: '18px' }}>
        {grid.map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7"
            style={{ borderBottom: wi < 5 ? '1px solid var(--border-light)' : 'none' }}
          >
            {week.map((day) => {
              const dayTodos = todosForDay(day)
              const today = isToday(day)
              const currentMonth = isCurrentMonth(day)
              const dateStr = toDateStr(day)
              const MAX_VISIBLE = 2
              const overflow = dayTodos.length - MAX_VISIBLE

              return (
                <button
                  key={dateStr}
                  onClick={() => onDayClick(dateStr)}
                  className="p-2 text-left min-h-[80px]"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRight: '1px solid var(--border-light)',
                  }}
                >
                  <div className="mb-1">
                    <span
                      className="w-6 h-6 rounded-full inline-flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: today ? '#0066cc' : 'transparent',
                        color: today ? '#ffffff' : currentMonth ? 'var(--text-primary)' : '#d2d2d7',
                        fontWeight: today ? 600 : 400,
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayTodos.slice(0, MAX_VISIBLE).map((todo) => (
                      <div
                        key={todo.id}
                        className="truncate text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: todo.completed ? 'var(--bg-hover)' : 'rgba(0,102,204,0.08)',
                          color: todo.completed ? 'var(--text-secondary)' : '#0066cc',
                        }}
                      >
                        {todo.title}
                      </div>
                    ))}
                    {overflow > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDayClick(dateStr) }}
                        className="text-xs font-medium hover:underline"
                        style={{ color: '#0066cc' }}
                      >
                        +{overflow}개 더
                      </button>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* 날짜 미정 섹션 */}
      <div className="overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px' }}>
        <button
          onClick={() => setShowNoDate(!showNoDate)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>날짜 미정</span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{noDateTodos.length}개 {showNoDate ? '▲' : '▼'}</span>
        </button>
        {showNoDate && (
          <div style={{ borderTop: '1px solid var(--border-light)' }}>
            {noDateTodos.length === 0 ? (
              <p className="px-5 py-4" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>없음</p>
            ) : (
              <div className="px-5 py-3 space-y-1">
                {noDateTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="text-sm px-3 py-2 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                  >
                    {todo.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

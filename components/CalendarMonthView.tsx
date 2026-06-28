'use client'

import { useState } from 'react'
import { Todo } from '@/types/todo'
import { toDateStr, getMonthGrid, isSameDay, isToday } from '@/lib/calendar'
import CalendarHeader from './CalendarHeader'

interface Props {
  date: Date
  todos: Todo[]
  onMonthChange: (date: Date) => void
  onDayClick: (dateStr: string) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarMonthView({ date, todos, onMonthChange, onDayClick }: Props) {
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
                  className="p-1 md:p-2 text-left min-h-[56px] md:min-h-[80px]"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRight: '1px solid var(--border-light)',
                  }}
                >
                  <div className="mb-1">
                    <span
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full inline-flex items-center justify-center"
                      style={{
                        backgroundColor: today ? '#0066cc' : 'transparent',
                        color: today ? '#ffffff' : currentMonth ? 'var(--text-primary)' : '#d2d2d7',
                        fontWeight: today ? 600 : 400,
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  {/* 데스크탑: 텍스트 todo 표시 */}
                  <div className="hidden md:block space-y-0.5">
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
                  {/* 모바일: 점으로만 표시 */}
                  {dayTodos.length > 0 && (
                    <div className="md:hidden flex gap-0.5 justify-center mt-0.5">
                      {dayTodos.slice(0, 3).map((todo) => (
                        <span
                          key={todo.id}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: todo.completed ? '#d2d2d7' : '#0066cc' }}
                        />
                      ))}
                      {dayTodos.length > 3 && (
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#d2d2d7' }} />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

    </div>
  )
}

'use client'

import { useState } from 'react'
import { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { toDateStr, getWeekDays, todoCoversDay, isToday } from '@/lib/calendar'
import CalendarHeader from './CalendarHeader'
import TodoItem from './TodoItem'
import TodoForm from './TodoForm'

interface Props {
  date: Date
  todos: Todo[]
  onWeekChange: (date: Date) => void
  onUpdate: (id: number, data: UpdateTodoInput) => void
  onDelete: (id: number) => void
  onCreate: (data: CreateTodoInput) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarWeekView({ date, todos, onWeekChange, onUpdate, onDelete, onCreate }: Props) {
  const [addingDate, setAddingDate] = useState<string | null>(null)
  const days = getWeekDays(date)

  const weekLabel = `${days[0].getFullYear()}년 ${days[0].getMonth() + 1}월 ${Math.ceil(days[0].getDate() / 7)}주차`

  const handlePrev = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 7)
    onWeekChange(d)
  }

  const handleNext = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 7)
    onWeekChange(d)
  }

  const todosForDay = (day: Date) =>
    todos.filter((t) => todoCoversDay(t, day))

  const handleCreate = (data: CreateTodoInput) => {
    onCreate({ ...data, dueDate: addingDate ?? undefined })
    setAddingDate(null)
  }

  return (
    <div>
      <CalendarHeader label={weekLabel} onPrev={handlePrev} onNext={handleNext} />

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-4">
      <div className="grid grid-cols-7 gap-1 md:gap-2" style={{ minWidth: '480px' }}>
        {days.map((day) => {
          const dayTodos = todosForDay(day)
          const todayStyle = isToday(day)
          const dateStr = toDateStr(day)
          return (
            <div key={dateStr}>
              <div className="text-center mb-2">
                <div
                  className="text-xs mb-1"
                  style={{ color: todayStyle ? '#0066cc' : 'var(--text-secondary)', fontWeight: todayStyle ? 600 : 400 }}
                >
                  {DAY_LABELS[day.getDay()]}
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center mx-auto text-sm font-semibold"
                  style={{
                    backgroundColor: todayStyle ? '#0066cc' : 'transparent',
                    color: todayStyle ? '#ffffff' : 'var(--text-primary)',
                  }}
                >
                  {day.getDate()}
                </div>
              </div>

              <div
                className="min-h-[80px] p-1 space-y-1"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '11px' }}
              >
                {dayTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="px-2 py-1 rounded text-xs truncate"
                    style={{
                      backgroundColor: todo.completed ? 'var(--bg-hover)' : 'rgba(0,102,204,0.08)',
                      color: todo.completed ? 'var(--text-secondary)' : '#0066cc',
                      textDecoration: todo.completed ? 'line-through' : 'none',
                    }}
                  >
                    {todo.title}
                  </div>
                ))}
                <button
                  onClick={() => setAddingDate(dateStr)}
                  className="w-full text-xs py-1 rounded transition-colors"
                  style={{ color: '#d2d2d7' }}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
      </div>

      {addingDate && (
        <div className="mb-4">
          <TodoForm
            onSubmit={handleCreate}
            onCancel={() => setAddingDate(null)}
            initialDate={addingDate}
          />
        </div>
      )}

    </div>
  )
}

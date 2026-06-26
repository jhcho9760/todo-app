'use client'

import { useState } from 'react'
import { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { toDateStr, getWeekDays, isSameDay, isToday } from '@/lib/calendar'
import CalendarHeader from './CalendarHeader'
import TodoItem from './TodoItem'
import TodoForm from './TodoForm'

interface Props {
  date: Date
  todos: Todo[]
  noDateTodos: Todo[]
  onWeekChange: (date: Date) => void
  onUpdate: (id: number, data: UpdateTodoInput) => void
  onDelete: (id: number) => void
  onCreate: (data: CreateTodoInput) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarWeekView({ date, todos, noDateTodos, onWeekChange, onUpdate, onDelete, onCreate }: Props) {
  const [addingDate, setAddingDate] = useState<string | null>(null)
  const [showNoDate, setShowNoDate] = useState(false)
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
    todos.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day))

  const handleCreate = (data: CreateTodoInput) => {
    onCreate({ ...data, dueDate: addingDate ?? undefined })
    setAddingDate(null)
  }

  return (
    <div>
      <CalendarHeader label={weekLabel} onPrev={handlePrev} onNext={handleNext} />

      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map((day) => {
          const dayTodos = todosForDay(day)
          const todayStyle = isToday(day)
          const dateStr = toDateStr(day)
          return (
            <div key={dateStr}>
              <div className="text-center mb-2">
                <div
                  className="text-xs mb-1"
                  style={{ color: todayStyle ? '#0066cc' : '#7a7a7a', fontWeight: todayStyle ? 600 : 400 }}
                >
                  {DAY_LABELS[day.getDay()]}
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center mx-auto text-sm font-semibold"
                  style={{
                    backgroundColor: todayStyle ? '#0066cc' : 'transparent',
                    color: todayStyle ? '#ffffff' : '#1d1d1f',
                  }}
                >
                  {day.getDate()}
                </div>
              </div>

              <div
                className="min-h-[80px] p-1 space-y-1"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '11px' }}
              >
                {dayTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="px-2 py-1 rounded text-xs truncate"
                    style={{
                      backgroundColor: todo.completed ? '#f5f5f7' : 'rgba(0,102,204,0.08)',
                      color: todo.completed ? '#7a7a7a' : '#0066cc',
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

      {addingDate && (
        <div className="mb-4">
          <TodoForm
            onSubmit={handleCreate}
            onCancel={() => setAddingDate(null)}
            initialDate={addingDate}
          />
        </div>
      )}

      <div
        className="overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '18px' }}
      >
        <button
          onClick={() => setShowNoDate(!showNoDate)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#7a7a7a' }}>날짜 미지정</span>
          <span style={{ fontSize: '14px', color: '#7a7a7a' }}>
            {noDateTodos.length}개 {showNoDate ? '▲' : '▼'}
          </span>
        </button>
        {showNoDate && (
          <div className="divide-y" style={{ borderColor: '#f0f0f0', borderTop: '1px solid #f0f0f0' }}>
            {noDateTodos.length === 0 ? (
              <p className="px-5 py-4" style={{ fontSize: '14px', color: '#7a7a7a' }}>없음</p>
            ) : (
              noDateTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

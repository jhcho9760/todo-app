'use client'

import { useState } from 'react'
import { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { toDateStr, isToday } from '@/lib/calendar'
import TodoItem from './TodoItem'
import TodoForm from './TodoForm'

interface Props {
  date: Date
  todos: Todo[]
  noDateTodos: Todo[]
  onUpdate: (id: number, data: UpdateTodoInput) => void
  onDelete: (id: number) => void
  onCreate: (data: CreateTodoInput) => void
}

export default function CalendarDayView({ date, todos, noDateTodos, onUpdate, onDelete, onCreate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [showNoDate, setShowNoDate] = useState(false)

  const dateLabel = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const handleCreate = (data: CreateTodoInput) => {
    onCreate({ ...data, dueDate: toDateStr(date) })
    setShowForm(false)
  }

  return (
    <div>
      <p className="mb-6" style={{ fontSize: '17px', color: 'var(--text-secondary)', letterSpacing: '-0.374px' }}>
        {dateLabel}
        {isToday(date) && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-white text-xs" style={{ backgroundColor: '#0066cc' }}>
            오늘
          </span>
        )}
      </p>

      {showForm ? (
        <TodoForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          initialDate={toDateStr(date)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-[18px] py-4 text-[17px] font-normal transition-transform active:scale-95 mb-4"
          style={{ border: '1px dashed var(--border)', color: '#0066cc', backgroundColor: 'var(--bg-card)' }}
        >
          + 할 일 추가
        </button>
      )}

      <div
        className="overflow-hidden mb-4"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px' }}
      >
        {todos.length === 0 ? (
          <p className="px-5 py-6 text-center" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            이 날의 할 일이 없습니다
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      {/* 날짜 미정 섹션 */}
      <div
        className="overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px' }}
      >
        <button
          onClick={() => setShowNoDate(!showNoDate)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>날짜 미정</span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {noDateTodos.length}개 {showNoDate ? '▲' : '▼'}
          </span>
        </button>
        {showNoDate && (
          <div className="divide-y" style={{ borderColor: 'var(--border-light)', borderTop: '1px solid var(--border-light)' }}>
            {noDateTodos.length === 0 ? (
              <p className="px-5 py-4" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>없음</p>
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

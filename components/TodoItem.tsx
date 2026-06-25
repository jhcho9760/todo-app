'use client'

import { useState } from 'react'
import { Todo, UpdateTodoInput } from '@/types/todo'
import TodoForm from './TodoForm'

interface Props {
  todo: Todo
  onUpdate: (id: number, data: UpdateTodoInput) => void
  onDelete: (id: number) => void
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
}

const PRIORITY_LABELS = {
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
}

export default function TodoItem({ todo, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <TodoForm
        initialValues={todo}
        onSubmit={(data) => {
          onUpdate(todo.id, data)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const dueDate = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString('ko-KR')
    : null

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg bg-white ${todo.completed ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onUpdate(todo.id, { completed: !todo.completed })}
        className="mt-1 w-4 h-4 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-400' : ''}`}>
            {todo.title}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[todo.priority]}`}>
            {PRIORITY_LABELS[todo.priority]}
          </span>
          {dueDate && (
            <span className="text-xs text-gray-500">📅 {dueDate}</span>
          )}
          {todo.category && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {todo.category}
            </span>
          )}
        </div>
        {todo.description && (
          <p className="text-sm text-gray-500 mt-1">{todo.description}</p>
        )}
        {todo.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {todo.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="text-xs px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

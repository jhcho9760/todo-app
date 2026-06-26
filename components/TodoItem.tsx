'use client'

import { useState } from 'react'
import { Todo, UpdateTodoInput } from '@/types/todo'
import TodoForm from './TodoForm'

interface Props {
  todo: Todo
  onUpdate: (id: number, data: UpdateTodoInput) => void
  onDelete: (id: number) => void
}

export default function TodoItem({ todo, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="px-5 py-4">
        <TodoForm
          initialValues={todo}
          onSubmit={(data) => {
            onUpdate(todo.id, data)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  const dueDate = todo.dueDate
    ? (() => {
        const [y, m, d] = todo.dueDate!.split('T')[0].split('-').map(Number)
        return new Date(y, m - 1, d).toLocaleDateString('ko-KR')
      })()
    : null

  return (
    <div
      className="flex items-start gap-3 px-5 py-4 group"
      style={{ opacity: todo.completed ? 0.5 : 1 }}
    >
      {/* 체크박스 */}
      <button
        onClick={() => onUpdate(todo.id, { completed: !todo.completed })}
        className="mt-[2px] shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors"
        style={{
          borderColor: todo.completed ? "#0066cc" : "#d2d2d7",
          backgroundColor: todo.completed ? "#0066cc" : "transparent",
        }}
      >
        {todo.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-normal"
            style={{
              fontSize: "17px",
              lineHeight: "1.47",
              letterSpacing: "-0.374px",
              color: todo.completed ? "var(--text-secondary)" : "var(--text-primary)",
              textDecoration: todo.completed ? "line-through" : "none",
            }}
          >
            {todo.title}
          </span>
        </div>

        {todo.description && (
          <p
            className="mt-1"
            style={{ fontSize: "14px", lineHeight: "1.43", letterSpacing: "-0.224px", color: "var(--text-secondary)" }}
          >
            {todo.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {todo.priority === 'HIGH' && (
            <span
              className="px-3 py-0.5 rounded-full font-normal"
              style={{ fontSize: "12px", color: "#ff3b30", backgroundColor: "rgba(255,59,48,0.08)" }}
            >
              높음
            </span>
          )}
          {todo.priority === 'MEDIUM' && (
            <span
              className="px-3 py-0.5 rounded-full font-normal"
              style={{ fontSize: "12px", color: "#ff9500", backgroundColor: "rgba(255,149,0,0.08)" }}
            >
              중간
            </span>
          )}
          {todo.priority === 'LOW' && (
            <span
              className="px-3 py-0.5 rounded-full font-normal"
              style={{ fontSize: "12px", color: "var(--text-secondary)", backgroundColor: "var(--bg-hover)" }}
            >
              낮음
            </span>
          )}
          {dueDate && (
            <span
              className="font-normal"
              style={{ fontSize: "12px", color: "var(--text-secondary)", letterSpacing: "-0.12px" }}
            >
              {dueDate}
            </span>
          )}
          {todo.category && (
            <span
              className="px-3 py-0.5 rounded-full font-normal"
              style={{
                fontSize: "12px",
                letterSpacing: "-0.12px",
                color: "#0066cc",
                backgroundColor: "rgba(0, 102, 204, 0.08)",
              }}
            >
              {todo.category}
            </span>
          )}
          {todo.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-0.5 rounded-full"
              style={{
                fontSize: "12px",
                letterSpacing: "-0.12px",
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-hover)",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1 rounded-full text-[12px] font-normal transition-colors active:scale-95"
          style={{ color: "#0066cc", backgroundColor: "rgba(0,102,204,0.08)" }}
        >
          수정
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="px-3 py-1 rounded-full text-[12px] font-normal transition-colors active:scale-95"
          style={{ color: "#ff3b30", backgroundColor: "rgba(255,59,48,0.08)" }}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

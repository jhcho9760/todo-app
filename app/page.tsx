'use client'

import { useState, useEffect, useCallback } from 'react'
import { Todo, CreateTodoInput, UpdateTodoInput, Filters, Priority } from '@/types/todo'
import TodoItem from '@/components/TodoItem'
import TodoForm from '@/components/TodoForm'
import FilterBar from '@/components/FilterBar'

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: '',
  priority: '',
  completed: '',
}

const PRIORITY_GROUPS: { priority: Priority; label: string; dot: string }[] = [
  { priority: 'HIGH',   label: '높음', dot: '#ff3b30' },
  { priority: 'MEDIUM', label: '중간', dot: '#ff9500' },
  { priority: 'LOW',    label: '낮음', dot: '#34c759' },
]

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchTodos = useCallback(async () => {
    const params = new URLSearchParams()
    if (filters.search)    params.set('search', filters.search)
    if (filters.category)  params.set('category', filters.category)
    if (filters.priority)  params.set('priority', filters.priority)
    if (filters.completed) params.set('completed', filters.completed)

    const res = await fetch(`/api/todos?${params}`)
    const data = await res.json()
    setTodos(data)
    setLoading(false)
  }, [filters])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  const handleCreate = async (data: CreateTodoInput) => {
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setShowForm(false)
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

  const categories = Array.from(
    new Set(todos.map((t) => t.category).filter(Boolean) as string[])
  )

  const grouped = (priority: Priority) => todos.filter((t) => t.priority === priority)

  return (
    <main className="max-w-3xl mx-auto px-4" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="font-semibold tracking-[-0.28px]"
          style={{ fontSize: "40px", lineHeight: "1.1", color: "#1d1d1f" }}
        >
          할 일
        </h1>
        <p
          className="mt-2 font-normal"
          style={{ fontSize: "17px", lineHeight: "1.47", letterSpacing: "-0.374px", color: "#7a7a7a" }}
        >
          {todos.filter(t => !t.completed).length}개 남음
        </p>
      </div>

      <div className="space-y-4">
        <FilterBar filters={filters} onChange={setFilters} categories={categories} />

        {showForm ? (
          <TodoForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-[18px] py-4 text-[17px] font-normal leading-[1.47] tracking-[-0.374px] transition-transform active:scale-95"
            style={{
              border: "1px dashed #e0e0e0",
              color: "#0066cc",
              backgroundColor: "#ffffff",
            }}
          >
            + 새 할 일 추가
          </button>
        )}

        {loading ? (
          <p
            className="text-center py-12"
            style={{ fontSize: "17px", color: "#7a7a7a" }}
          >
            불러오는 중...
          </p>
        ) : (
          <div className="space-y-4">
            {PRIORITY_GROUPS.map(({ priority, label, dot }) => {
              const items = grouped(priority)
              return (
                <div
                  key={priority}
                  className="overflow-hidden"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "18px",
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-5 py-4"
                    style={{ borderBottom: items.length > 0 ? "1px solid #f0f0f0" : undefined }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dot }}
                    />
                    <span
                      className="font-semibold"
                      style={{ fontSize: "14px", lineHeight: "1.29", letterSpacing: "-0.224px", color: "#1d1d1f" }}
                    >
                      {label}
                    </span>
                    <span
                      className="ml-auto"
                      style={{ fontSize: "14px", color: "#7a7a7a" }}
                    >
                      {items.length}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p
                      className="px-5 py-4"
                      style={{ fontSize: "14px", color: "#7a7a7a" }}
                    >
                      없음
                    </p>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "#f0f0f0" }}>
                      {items.map((todo) => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

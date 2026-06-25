'use client'

import { useState, useEffect, useCallback } from 'react'
import { Todo, CreateTodoInput, UpdateTodoInput, Filters } from '@/types/todo'
import TodoItem from '@/components/TodoItem'
import TodoForm from '@/components/TodoForm'
import FilterBar from '@/components/FilterBar'

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: '',
  priority: '',
  completed: '',
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchTodos = useCallback(async () => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.completed) params.set('completed', filters.completed)

    const res = await fetch(`/api/todos?${params}`)
    const data = await res.json()
    setTodos(data)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

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

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">📋 To-Do Board</h1>

      <div className="space-y-4">
        <FilterBar filters={filters} onChange={setFilters} categories={categories} />

        {showForm ? (
          <TodoForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + 새 할 일 추가
          </button>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-8">불러오는 중...</p>
        ) : todos.length === 0 ? (
          <p className="text-center text-gray-400 py-8">할 일이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
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
    </main>
  )
}

'use client'

import { useState } from 'react'
import { Todo, Priority, CreateTodoInput } from '@/types/todo'

interface Props {
  onSubmit: (data: CreateTodoInput) => void
  initialValues?: Todo
  onCancel?: () => void
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH']
const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
}

export default function TodoForm({ onSubmit, initialValues, onCancel }: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [priority, setPriority] = useState<Priority>(initialValues?.priority ?? 'MEDIUM')
  const [dueDate, setDueDate] = useState(
    initialValues?.dueDate ? initialValues.dueDate.split('T')[0] : ''
  )
  const [category, setCategory] = useState(initialValues?.category ?? '')
  const [tagInput, setTagInput] = useState(initialValues?.tags.join(', ') ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      category: category.trim() || undefined,
      tags: tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white border rounded-lg p-4">
      <input
        type="text"
        placeholder="할 일 제목 *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <textarea
        placeholder="설명 (선택)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
      />
      <div className="flex gap-2 flex-wrap">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="카테고리"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />
      </div>
      <input
        type="text"
        placeholder="태그 (쉼표로 구분: work, urgent)"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {initialValues ? '수정' : '추가'}
        </button>
      </div>
    </form>
  )
}

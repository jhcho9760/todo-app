'use client'

import { Filters } from '@/types/todo'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  categories: string[]
}

export default function FilterBar({ filters, onChange, categories }: Props) {
  const update = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="flex gap-2 flex-wrap">
      <input
        type="text"
        placeholder="검색..."
        value={filters.search}
        onChange={(e) => update('search', e.target.value)}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-40"
      />
      <select
        value={filters.category}
        onChange={(e) => update('category', e.target.value)}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">전체 카테고리</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        value={filters.priority}
        onChange={(e) => update('priority', e.target.value)}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">전체 우선순위</option>
        <option value="HIGH">높음</option>
        <option value="MEDIUM">중간</option>
        <option value="LOW">낮음</option>
      </select>
      <select
        value={filters.completed}
        onChange={(e) => update('completed', e.target.value)}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">전체 상태</option>
        <option value="false">미완료</option>
        <option value="true">완료</option>
      </select>
    </div>
  )
}

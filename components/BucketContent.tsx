'use client'

import { useState, useEffect } from 'react'

interface BucketItem { id: number; title: string; completed: boolean; createdAt: string }

export default function BucketContent() {
  const [items, setItems] = useState<BucketItem[]>([])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/bucket').then((r) => r.json()).then((data) => setItems(Array.isArray(data) ? data : []))
  }, [])

  const handleAdd = async () => {
    if (!input.trim()) return
    setSaving(true)
    const res = await fetch('/api/bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: input.trim() }),
    })
    const created = await res.json()
    setItems((prev) => [...prev, created])
    setInput('')
    setSaving(false)
  }

  const handleToggle = async (item: BucketItem) => {
    const updated = { ...item, completed: !item.completed }
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
    await fetch('/api/bucket', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, completed: !item.completed }),
    })
  }

  const handleDelete = async (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await fetch('/api/bucket', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  const done = items.filter((i) => i.completed)
  const todo = items.filter((i) => !i.completed)

  return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '640px', paddingBottom: '80px' }}>
      <div className="mb-8">
        <h1 className="font-semibold" style={{ fontSize: '34px', color: 'var(--text-primary)', letterSpacing: '-0.28px' }}>
          버킷리스트
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>함께 이루고 싶은 것들을 기록하세요</p>
      </div>

      {/* 입력창 */}
      <div className="flex gap-2 mb-8">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder="새 버킷리스트 항목..."
          className="flex-1 rounded-[12px] px-4 py-3 outline-none"
          style={{
            fontSize: '15px',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !input.trim()}
          className="px-5 py-3 rounded-[12px] transition-colors"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: input.trim() ? '#0066cc' : 'var(--bg-hover)',
            color: input.trim() ? '#ffffff' : '#b0b0b5',
          }}
        >
          추가
        </button>
      </div>

      {/* 미완료 목록 */}
      {todo.length > 0 && (
        <div className="mb-6">
          <p className="mb-3" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            남은 목표 {todo.length}
          </p>
          <div className="flex flex-col gap-2">
            {todo.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* 완료 목록 */}
      {done.length > 0 && (
        <div>
          <p className="mb-3" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            달성 {done.length}
          </p>
          <div className="flex flex-col gap-2">
            {done.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '48px', marginBottom: '12px' }}>🌟</span>
          <p style={{ fontSize: '15px' }}>함께 이루고 싶은 것들을 추가해보세요</p>
        </div>
      )}
    </main>
  )
}

function ItemRow({ item, onToggle, onDelete }: {
  item: BucketItem
  onToggle: (item: BucketItem) => void
  onDelete: (id: number) => void
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-[12px] group"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <button
        onClick={() => onToggle(item)}
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
        style={{
          backgroundColor: item.completed ? '#0066cc' : 'transparent',
          border: item.completed ? '2px solid #0066cc' : '2px solid var(--border)',
        }}
      >
        {item.completed && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span
        className="flex-1"
        style={{
          fontSize: '15px',
          color: item.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
          textDecoration: item.completed ? 'line-through' : 'none',
        }}
      >
        {item.title}
      </span>
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ fontSize: '18px', color: '#b0b0b5', lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  )
}

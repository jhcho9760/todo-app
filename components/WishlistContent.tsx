'use client'

import { useState, useEffect } from 'react'

interface WishlistItem {
  id: number; title: string; category: string; memo: string
  completed: boolean; completedAt: string | null; createdAt: string
}

const CATEGORIES = [
  { key: 'movie', label: '영화/드라마', emoji: '🎬' },
  { key: 'restaurant', label: '식당', emoji: '🍽️' },
  { key: 'cafe', label: '카페', emoji: '☕' },
  { key: 'travel', label: '여행지', emoji: '✈️' },
  { key: 'etc', label: '기타', emoji: '⭐' },
]

const getCat = (key: string) => CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[4]

export default function WishlistContent() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showDone, setShowDone] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('movie')
  const [memo, setMemo] = useState('')

  useEffect(() => {
    fetch('/api/wishlist').then((r) => r.json()).then((data) => setItems(Array.isArray(data) ? data : []))
  }, [])

  const handleAdd = async () => {
    if (!title.trim()) return
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), category, memo: memo.trim() }),
    })
    const created = await res.json()
    setItems((prev) => [created, ...prev])
    setTitle(''); setMemo(''); setShowForm(false)
  }

  const handleToggle = async (item: WishlistItem) => {
    const res = await fetch('/api/wishlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, completed: !item.completed }),
    })
    const updated = await res.json()
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
  }

  const handleDelete = async (id: number) => {
    await fetch('/api/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const filtered = items.filter((i) => {
    if (i.completed !== showDone) return false
    if (activeCategory !== 'all' && i.category !== activeCategory) return false
    return true
  })

  const todoCount = items.filter((i) => !i.completed).length
  const doneCount = items.filter((i) => i.completed).length

  return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '680px', paddingBottom: '80px' }}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-semibold" style={{ fontSize: '34px', color: 'var(--text-primary)', letterSpacing: '-0.28px' }}>
            우리 리스트
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>같이 하고 싶은 것들</p>
        </div>
        <button
          onClick={() => { setTitle(''); setMemo(''); setCategory('movie'); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full"
          style={{ backgroundColor: '#0066cc', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}
        >
          + 추가
        </button>
      </div>

      {/* 할일/완료 탭 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowDone(false)}
          className="px-4 py-1.5 rounded-full"
          style={{ fontSize: '13px', fontWeight: 600, backgroundColor: !showDone ? '#0066cc' : 'var(--bg-hover)', color: !showDone ? '#fff' : 'var(--text-secondary)' }}
        >
          할 것 {todoCount}
        </button>
        <button
          onClick={() => setShowDone(true)}
          className="px-4 py-1.5 rounded-full"
          style={{ fontSize: '13px', fontWeight: 600, backgroundColor: showDone ? '#0066cc' : 'var(--bg-hover)', color: showDone ? '#fff' : 'var(--text-secondary)' }}
        >
          완료 {doneCount}
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className="px-3 py-1.5 rounded-full"
          style={{ fontSize: '12px', fontWeight: 600, backgroundColor: activeCategory === 'all' ? 'var(--text-primary)' : 'var(--bg-hover)', color: activeCategory === 'all' ? 'var(--bg-card)' : 'var(--text-secondary)' }}
        >
          전체
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className="px-3 py-1.5 rounded-full flex items-center gap-1"
            style={{ fontSize: '12px', fontWeight: 600, backgroundColor: activeCategory === cat.key ? 'var(--text-primary)' : 'var(--bg-hover)', color: activeCategory === cat.key ? 'var(--bg-card)' : 'var(--text-secondary)' }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>{showDone ? '🎉' : '📝'}</span>
          <p style={{ fontSize: '15px' }}>{showDone ? '아직 완료한 항목이 없어요' : '추가해보세요!'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => {
            const cat = getCat(item.category)
            return (
              <div key={item.id}
                className="flex items-start gap-3 rounded-[14px] px-4 py-3 group"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => handleToggle(item)}
                  className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: item.completed ? '#0066cc' : 'transparent', border: item.completed ? '2px solid #0066cc' : '2px solid var(--border)' }}
                >
                  {item.completed && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize: '13px' }}>{cat.emoji}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{cat.label}</span>
                  </div>
                  <p style={{ fontSize: '15px', color: 'var(--text-primary)', textDecoration: item.completed ? 'line-through' : 'none', opacity: item.completed ? 0.5 : 1 }}>
                    {item.title}
                  </p>
                  {item.memo && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.memo}</p>
                  )}
                  {item.completedAt && (
                    <p style={{ fontSize: '11px', color: '#34c759', marginTop: '4px' }}>✓ {item.completedAt} 완료</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                  style={{ fontSize: '18px', color: '#b0b0b5', lineHeight: 1 }}
                >×</button>
              </div>
            )
          })}
        </div>
      )}

      {/* 추가 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowForm(false)}
        >
          <div className="w-full md:w-[420px] rounded-t-[24px] md:rounded-[24px] p-6"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>항목 추가</h2>

            {/* 카테고리 */}
            <div className="flex gap-2 flex-wrap mb-4">
              {CATEGORIES.map((cat) => (
                <button key={cat.key} onClick={() => setCategory(cat.key)}
                  className="px-3 py-1.5 rounded-full flex items-center gap-1"
                  style={{ fontSize: '13px', fontWeight: 600, backgroundColor: category === cat.key ? '#0066cc' : 'var(--bg-hover)', color: category === cat.key ? '#fff' : 'var(--text-secondary)', border: category === cat.key ? '1.5px solid #0066cc' : '1.5px solid transparent' }}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 (예: 범죄도시 4, 성수동 카페)"
              className="w-full rounded-[12px] px-4 py-3 outline-none mb-3"
              style={{ fontSize: '15px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}
            />
            <input value={memo} onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 (선택사항)"
              className="w-full rounded-[12px] px-4 py-3 outline-none mb-5"
              style={{ fontSize: '15px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}
            />

            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-[12px]"
                style={{ fontSize: '15px', fontWeight: 600, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                취소
              </button>
              <button onClick={handleAdd} disabled={!title.trim()} className="flex-1 py-3 rounded-[12px]"
                style={{ fontSize: '15px', fontWeight: 600, backgroundColor: title.trim() ? '#0066cc' : 'var(--bg-hover)', color: title.trim() ? '#fff' : '#b0b0b5' }}>
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

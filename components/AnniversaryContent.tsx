'use client'

import { useState, useEffect } from 'react'

interface Anniversary { id: number; name: string; date: string; emoji: string }

const EMOJI_OPTIONS = ['🎉', '❤️', '💍', '🌹', '🥂', '✈️', '🏠', '🐾', '⭐', '🎂']

function calcDays(dateStr: string): { dPlus: number; dMinus: number; nextDate: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = dateStr.split('-').map(Number)
  const origin = new Date(y, m - 1, d)
  const dPlus = Math.floor((today.getTime() - origin.getTime()) / 86400000)

  // 올해 기념일
  let next = new Date(today.getFullYear(), m - 1, d)
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d)
  const dMinus = Math.floor((next.getTime() - today.getTime()) / 86400000)
  const nextDate = next.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  return { dPlus, dMinus, nextDate }
}

export default function AnniversaryContent() {
  const [items, setItems] = useState<Anniversary[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Anniversary | null>(null)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [emoji, setEmoji] = useState('🎉')

  useEffect(() => {
    fetch('/api/anniversaries').then((r) => r.json()).then((data) => setItems(Array.isArray(data) ? data : []))
  }, [])

  const openAdd = () => { setEditItem(null); setName(''); setDate(''); setEmoji('🎉'); setShowForm(true) }
  const openEdit = (item: Anniversary) => { setEditItem(item); setName(item.name); setDate(item.date); setEmoji(item.emoji); setShowForm(true) }

  const handleSave = async () => {
    if (!name.trim() || !date) return
    if (editItem) {
      const res = await fetch('/api/anniversaries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editItem.id, name: name.trim(), date, emoji }),
      })
      const updated = await res.json()
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? updated : i)))
    } else {
      const res = await fetch('/api/anniversaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), date, emoji }),
      })
      const created = await res.json()
      setItems((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)))
    }
    setShowForm(false)
  }

  const handleDelete = async (id: number) => {
    await fetch('/api/anniversaries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '640px', paddingBottom: '80px' }}>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-semibold" style={{ fontSize: '34px', color: 'var(--text-primary)', letterSpacing: '-0.28px' }}>
            기념일
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>우리의 소중한 날들을 기록하세요</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full"
          style={{ backgroundColor: '#0066cc', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}
        >
          + 추가
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '48px', marginBottom: '12px' }}>🗓️</span>
          <p style={{ fontSize: '15px' }}>기념일을 추가해보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const { dPlus, dMinus, nextDate } = calcDays(item.date)
            const [y, m, d] = item.date.split('-').map(Number)
            const originLabel = new Date(y, m - 1, d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
            return (
              <div
                key={item.id}
                className="rounded-[18px] px-5 py-4 flex items-center gap-4 group"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,102,204,0.08)', fontSize: '28px' }}
                >
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{originLabel}</p>
                  <div className="flex gap-3 mt-2">
                    {dPlus >= 0 && (
                      <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: '12px', fontWeight: 600, backgroundColor: 'rgba(0,102,204,0.1)', color: '#0066cc' }}>
                        D+{dPlus}
                      </span>
                    )}
                    {dMinus === 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: '12px', fontWeight: 600, backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}>
                        오늘!
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: '12px', fontWeight: 600, backgroundColor: 'rgba(52,199,89,0.1)', color: '#34c759' }}>
                        D-{dMinus} ({nextDate})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(item)} style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>✏️</button>
                  <button onClick={() => handleDelete(item.id)} style={{ fontSize: '18px', color: '#ff3b30' }}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full md:w-[400px] rounded-t-[24px] md:rounded-[24px] p-6"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {editItem ? '기념일 수정' : '기념일 추가'}
            </h2>

            {/* 이모지 선택 */}
            <div className="flex gap-2 flex-wrap mb-4">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    fontSize: '20px',
                    backgroundColor: emoji === e ? 'rgba(0,102,204,0.15)' : 'var(--bg-hover)',
                    border: emoji === e ? '2px solid #0066cc' : '2px solid transparent',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="기념일 이름 (예: 처음 만난 날)"
              className="w-full rounded-[12px] px-4 py-3 outline-none mb-3"
              style={{ fontSize: '15px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-[12px] px-4 py-3 outline-none mb-5"
              style={{ fontSize: '15px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}
            />

            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-[12px]"
                style={{ fontSize: '15px', fontWeight: 600, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                취소
              </button>
              <button onClick={handleSave} disabled={!name.trim() || !date} className="flex-1 py-3 rounded-[12px]"
                style={{ fontSize: '15px', fontWeight: 600, backgroundColor: name.trim() && date ? '#0066cc' : 'var(--bg-hover)', color: name.trim() && date ? '#ffffff' : '#b0b0b5' }}>
                {editItem ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

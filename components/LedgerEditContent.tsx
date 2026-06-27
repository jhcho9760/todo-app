'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const CATEGORIES = ['식사', '카페', '영화', '쇼핑', '숙소', '기타']

interface LedgerEntry { id: number; date: string; label: string; amount: number; category: string; paidBy: string }

export default function LedgerEditContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  const dateLabel = (() => {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  })()

  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [names, setNames] = useState<[string, string]>(['', ''])
  const [form, setForm] = useState({ label: '', amount: '', category: '식사', paidBy: '' })
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ label: '', amount: '', category: '식사', paidBy: '' })

  const fetchEntries = useCallback(async () => {
    const res = await fetch(`/api/ledger?date=${date}`)
    setEntries(await res.json())
  }, [date])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        const n1 = data.ledger_name_1 ?? ''
        const n2 = data.ledger_name_2 ?? ''
        setNames([n1, n2])
        setForm((f) => ({ ...f, paidBy: n1 }))
      })
  }, [])

  const handleAdd = async () => {
    if (!form.label || !form.amount) return
    setAdding(true)
    await fetch('/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, label: form.label, amount: Number(form.amount), category: form.category, paidBy: form.paidBy }),
    })
    setForm((f) => ({ ...f, label: '', amount: '' }))
    setAdding(false)
    fetchEntries()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/ledger/${id}`, { method: 'DELETE' })
    fetchEntries()
  }

  const handleEditStart = (e: LedgerEntry) => {
    setEditingId(e.id)
    setEditForm({ label: e.label, amount: String(e.amount), category: e.category, paidBy: e.paidBy })
  }

  const handleEditSave = async (id: number) => {
    await fetch(`/api/ledger/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: editForm.label, amount: Number(editForm.amount), category: editForm.category, paidBy: editForm.paidBy }),
    })
    setEditingId(null)
    fetchEntries()
  }

  const total = entries.reduce((s, e) => s + e.amount, 0)

  return (
    <main className="px-4 py-6" style={{ maxWidth: '680px', paddingBottom: '100px' }}>
      {/* 상단 네비 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1"
          style={{ fontSize: '16px', color: '#0066cc' }}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path d="M8 2L2 8L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          가계부
        </button>
      </div>

      <p className="mb-4" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{dateLabel}</p>

      {/* 지출 목록 */}
      <div className="flex flex-col gap-2 mb-4">
        {entries.length === 0 && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>지출 내역이 없습니다</p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="rounded-[10px] px-3 py-2" style={{ backgroundColor: 'var(--bg-hover)' }}>
            {editingId === e.id ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editForm.label}
                  onChange={(ev) => setEditForm((f) => ({ ...f, label: ev.target.value }))}
                  className="w-full outline-none px-2 py-1 rounded-[6px]"
                  style={{ fontSize: '14px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <input
                  value={editForm.amount}
                  onChange={(ev) => setEditForm((f) => ({ ...f, amount: ev.target.value.replace(/[^0-9]/g, '') }))}
                  type="text"
                  inputMode="numeric"
                  className="w-full outline-none px-2 py-1 rounded-[6px]"
                  style={{ fontSize: '14px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <div className="flex gap-2">
                  <select
                    value={editForm.category}
                    onChange={(ev) => setEditForm((f) => ({ ...f, category: ev.target.value }))}
                    className="flex-1 outline-none px-2 py-1 rounded-[6px]"
                    style={{ fontSize: '13px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={editForm.paidBy}
                    onChange={(ev) => setEditForm((f) => ({ ...f, paidBy: ev.target.value }))}
                    className="flex-1 outline-none px-2 py-1 rounded-[6px]"
                    style={{ fontSize: '13px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    {names.filter(Boolean).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>취소</button>
                  <button
                    onClick={() => handleEditSave(e.id)}
                    className="px-3 py-1 rounded-full"
                    style={{ fontSize: '13px', fontWeight: 600, backgroundColor: '#0066cc', color: '#fff' }}
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button className="flex-1 text-left" onClick={() => handleEditStart(e)}>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{e.label}</span>
                  <span className="ml-2" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.category} · {e.paidBy}</span>
                </button>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{e.amount.toLocaleString()}원</span>
                  <button onClick={() => handleDelete(e.id)} style={{ fontSize: '16px', color: '#ff3b30' }}>×</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 합계 */}
      {entries.length > 0 && (
        <div className="flex justify-between mb-6 px-1" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>합계</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{total.toLocaleString()}원</span>
        </div>
      )}

      {/* 입력 폼 */}
      <div className="flex flex-col gap-2 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
        <input
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="항목명"
          className="w-full outline-none px-3 py-2 rounded-[8px]"
          style={{ fontSize: '14px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
        />
        <input
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))}
          placeholder="금액 (원)"
          type="text"
          inputMode="numeric"
          className="w-full outline-none px-3 py-2 rounded-[8px]"
          style={{ fontSize: '14px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
        />
        <div className="flex gap-2">
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="flex-1 outline-none px-3 py-2 rounded-[8px]"
            style={{ fontSize: '14px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={form.paidBy}
            onChange={(e) => setForm((f) => ({ ...f, paidBy: e.target.value }))}
            className="flex-1 outline-none px-3 py-2 rounded-[8px]"
            style={{ fontSize: '14px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
          >
            {names.filter(Boolean).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || !form.label || !form.amount}
          className="w-full py-2 rounded-full transition-colors"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: form.label && form.amount ? '#0066cc' : 'var(--bg-hover)',
            color: form.label && form.amount ? '#ffffff' : '#b0b0b5',
          }}
        >
          {adding ? '추가 중...' : '추가'}
        </button>
      </div>
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Trip, TripPlace } from './TripFormSheet'

interface TripChecklist {
  id: number
  tripId: number
  category: string
  text: string
  checked: boolean
}

interface TripExpense {
  id: number
  tripId: number
  date: string
  name: string
  amount: number
}

const CHECKLIST_CATEGORIES = ['준비물', '예약', '숙소', '기타'] as const

function getDayDates(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

const inputStyle: React.CSSProperties = {
  fontSize: '16px',
  backgroundColor: 'var(--bg-hover)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '8px 12px',
  outline: 'none',
  border: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
}

interface Props {
  trip: Trip
  onPlacesChange: () => void
}

export default function TripPlanTab({ trip, onPlacesChange }: Props) {
  const [checklists, setChecklists] = useState<TripChecklist[]>([])
  const [expenses, setExpenses] = useState<TripExpense[]>([])
  const [newCheckText, setNewCheckText] = useState<Record<string, string>>({})
  const [expenseForm, setExpenseForm] = useState({ date: trip.startDate ?? '', name: '', amount: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/trips/${trip.id}/checklists`).then(r => r.json()).then(setChecklists)
    fetch(`/api/trips/${trip.id}/expenses`).then(r => r.json()).then(setExpenses)
  }, [trip.id])

  const assignDay = async (placeId: number, dayIndex: number | null) => {
    try {
      await fetch(`/api/trips/${trip.id}/places/${placeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayIndex }),
      })
      onPlacesChange()
    } catch (e) {
      console.error('장소 배정 실패:', e)
    }
  }

  const addChecklist = async (category: string) => {
    const text = newCheckText[category]?.trim()
    if (!text) return
    const item: TripChecklist = await fetch(`/api/trips/${trip.id}/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, text }),
    }).then(r => r.json())
    setChecklists(prev => [...prev, item])
    setNewCheckText(prev => ({ ...prev, [category]: '' }))
  }

  const toggleChecklist = async (item: TripChecklist) => {
    const updated: TripChecklist = await fetch(`/api/trips/${trip.id}/checklists/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !item.checked }),
    }).then(r => r.json())
    setChecklists(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const deleteChecklist = async (id: number) => {
    await fetch(`/api/trips/${trip.id}/checklists/${id}`, { method: 'DELETE' })
    setChecklists(prev => prev.filter(c => c.id !== id))
  }

  const addExpense = async () => {
    const { date, name, amount } = expenseForm
    if (!date || !name || !amount) return
    setSaving(true)
    try {
      const item: TripExpense = await fetch(`/api/trips/${trip.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, name, amount: Number(amount) }),
      }).then(r => r.json())
      setExpenses(prev => [...prev, item])
      setExpenseForm({ date: trip.startDate ?? '', name: '', amount: '' })
    } finally {
      setSaving(false)
    }
  }

  const deleteExpense = async (id: number) => {
    await fetch(`/api/trips/${trip.id}/expenses/${id}`, { method: 'DELETE' })
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)

  const dayDates = trip.startDate && trip.endDate ? getDayDates(trip.startDate, trip.endDate) : []
  const places = trip.places
  const unassignedPlaces = places.filter(p => p.dayIndex == null)

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>

      {/* 날짜별 일정 */}
      {dayDates.length > 0 && (
        <section>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>📅 날짜별 일정</p>

          {/* 미배정 장소 */}
          {unassignedPlaces.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>미배정 장소</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {unassignedPlaces.map(p => (
                  <span key={p.id} style={{ fontSize: '13px', backgroundColor: 'var(--bg-hover)', borderRadius: '100px', padding: '4px 10px', color: 'var(--text-primary)' }}>
                    📍 {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {dayDates.map((date, idx) => {
            const dayNum = idx + 1
            const dayPlaces = places.filter(p => p.dayIndex === dayNum)
            return (
              <div key={date} style={{ marginBottom: '12px', backgroundColor: 'var(--bg-hover)', borderRadius: '12px', padding: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>{dayNum}일차 · {date}</p>
                {dayPlaces.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>장소를 추가하세요</p>
                )}
                {dayPlaces.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', flex: 1, color: 'var(--text-primary)' }}>📍 {p.name}</span>
                    <button
                      onClick={() => assignDay(p.id, null)}
                      style={{ fontSize: '12px', color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}
                    >제거</button>
                  </div>
                ))}
                {unassignedPlaces.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) assignDay(Number(e.target.value), dayNum) }}
                    style={{ ...inputStyle, fontSize: '16px', marginTop: '4px' }}
                  >
                    <option value="">+ 장소 추가</option>
                    {unassignedPlaces.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* 체크리스트 */}
      <section>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>✅ 체크리스트</p>
        {CHECKLIST_CATEGORIES.map(cat => {
          const items = checklists.filter(c => c.category === cat)
          return (
            <div key={cat} style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{cat}</p>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklist(item)}
                    style={{ width: '16px', height: '16px', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)', textDecoration: item.checked ? 'line-through' : 'none', opacity: item.checked ? 0.5 : 1 }}>
                    {item.text}
                  </span>
                  <button onClick={() => deleteChecklist(item.id)} style={{ fontSize: '16px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <input
                  value={newCheckText[cat] ?? ''}
                  onChange={(e) => setNewCheckText(prev => ({ ...prev, [cat]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addChecklist(cat)}
                  placeholder="항목 추가..."
                  style={{ ...inputStyle, flex: 1, fontSize: '16px', padding: '6px 10px' }}
                />
                <button
                  onClick={() => addChecklist(cat)}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                >추가</button>
              </div>
            </div>
          )
        })}
      </section>

      {/* 예산 */}
      <section style={{ paddingBottom: '120px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>💰 예산</p>

        {/* 날짜별 지출 목록 */}
        {dayDates.length === 0 && expenses.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>아직 지출 내역이 없습니다.</p>
        )}
        {(dayDates.length > 0 ? dayDates : [...new Set(expenses.map(e => e.date))]).map(date => {
          const dayExpenses = expenses.filter(e => e.date === date)
          if (dayExpenses.length === 0 && dayDates.length > 0) return null
          return (
            <div key={date} style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>{date}</p>
              {dayExpenses.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{e.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{e.amount.toLocaleString()}원</span>
                  <button onClick={() => deleteExpense(e.id)} style={{ fontSize: '16px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )
        })}

        {/* 총합 */}
        {expenses.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid var(--border)', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>총 지출</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0066cc' }}>{totalExpense.toLocaleString()}원</span>
          </div>
        )}

        {/* 지출 추가 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--bg-hover)', borderRadius: '12px', padding: '12px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>지출 추가</p>
          <select
            value={expenseForm.date}
            onChange={(e) => setExpenseForm(f => ({ ...f, date: e.target.value }))}
            style={inputStyle}
          >
            {(dayDates.length > 0 ? dayDates : [trip.startDate]).filter(Boolean).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            value={expenseForm.name}
            onChange={(e) => setExpenseForm(f => ({ ...f, name: e.target.value }))}
            placeholder="항목명 (예: 점심식사)"
            style={inputStyle}
          />
          <input
            type="number"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="금액"
            style={inputStyle}
          />
          <button
            onClick={addExpense}
            disabled={saving || !expenseForm.name || !expenseForm.amount}
            style={{
              width: '100%', padding: '10px', borderRadius: '100px',
              fontSize: '14px', fontWeight: 600, border: 'none',
              cursor: (expenseForm.name && expenseForm.amount) ? 'pointer' : 'default',
              backgroundColor: (expenseForm.name && expenseForm.amount) ? '#0066cc' : 'var(--bg-hover)',
              color: (expenseForm.name && expenseForm.amount) ? '#fff' : '#b0b0b5',
            }}
          >
            {saving ? '저장 중...' : '추가'}
          </button>
        </div>
      </section>
    </div>
  )
}

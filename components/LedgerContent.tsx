'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getMonthGrid, toDateStr, isToday } from '@/lib/calendar'
import CalendarHeader from '@/components/CalendarHeader'

const CATEGORIES = ['식사', '카페', '영화', '쇼핑', '숙소', '기타']
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface LedgerEntry { id: number; date: string; label: string; amount: number; category: string; paidBy: string }
interface DayTotal { date: string; total: number }

export default function LedgerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const dateParam = searchParams.get('date')
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (dateParam) {
      const [y, m] = dateParam.split('-').map(Number)
      return new Date(y, m - 1, 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })

  const [dayTotals, setDayTotals] = useState<DayTotal[]>([])
  const [byPerson, setByPerson] = useState<Record<string, number>>({})
  const [byCategory, setByCategory] = useState<Record<string, number>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(dateParam)
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [names, setNames] = useState<[string, string]>(['', ''])
  const [form, setForm] = useState({ label: '', amount: '', category: '식사', paidBy: '' })
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ label: '', amount: '', category: '식사', paidBy: '' })

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

  const fetchMonthTotals = useCallback(async () => {
    const res = await fetch(`/api/ledger?month=${monthKey}`)
    const data = await res.json()
    setDayTotals(data.byDate ?? [])
    setByPerson(data.byPerson ?? {})
    setByCategory(data.byCategory ?? {})
  }, [monthKey])

  const fetchEntries = useCallback(async (date: string) => {
    const res = await fetch(`/api/ledger?date=${date}`)
    setEntries(await res.json())
  }, [])

  useEffect(() => { fetchMonthTotals() }, [fetchMonthTotals])

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

  useEffect(() => {
    if (selectedDate) fetchEntries(selectedDate)
    else setEntries([])
  }, [selectedDate, fetchEntries])

  const handleDayClick = (dateStr: string) => {
    if (window.innerWidth < 768) {
      router.push(`/ledger/edit?date=${dateStr}`)
      return
    }
    setSelectedDate(dateStr)
    router.replace(`/ledger?date=${dateStr}`, { scroll: false })
  }

  const handleAdd = async () => {
    if (!selectedDate || !form.label || !form.amount) return
    setAdding(true)
    await fetch('/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, label: form.label, amount: Number(form.amount), category: form.category, paidBy: form.paidBy }),
    })
    setForm((f) => ({ ...f, label: '', amount: '' }))
    setAdding(false)
    await fetchEntries(selectedDate)
    fetchMonthTotals()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/ledger/${id}`, { method: 'DELETE' })
    if (selectedDate) await fetchEntries(selectedDate)
    fetchMonthTotals()
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
    if (selectedDate) await fetchEntries(selectedDate)
    fetchMonthTotals()
  }

  const getDayTotal = (dateStr: string) => dayTotals.find((d) => d.date === dateStr)?.total ?? 0
  const monthTotal = dayTotals.reduce((sum, d) => sum + d.total, 0)

  const grid = getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth())
  const label = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`
  const handlePrev = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const handleNext = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const namesSet = names[0] && names[1]

  const selectedDateLabel = selectedDate
    ? (() => {
        const [y, m, d] = selectedDate.split('-').map(Number)
        return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
      })()
    : ''

  return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '960px', paddingBottom: '80px' }}>
      <div className="mb-6">
        <h1 className="font-semibold" style={{ fontSize: '34px', color: 'var(--text-primary)', letterSpacing: '-0.28px' }}>
          데이트 가계부
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>날짜를 선택해서 지출을 기록하세요</p>
      </div>

      {!namesSet && (
        <div className="mb-4 px-4 py-3 rounded-[12px]" style={{ backgroundColor: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.3)' }}>
          <p style={{ fontSize: '14px', color: '#ff9500' }}>
            두 사람 이름이 설정되지 않았습니다.{' '}
            <a href="/ledger/settings" style={{ fontWeight: 600, textDecoration: 'underline' }}>설정하기</a>
          </p>
        </div>
      )}

      {/* 월 요약 카드 */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="rounded-[14px] px-4 py-3 flex-1 min-w-[120px]"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>이번 달 총액</p>
          <p style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {monthTotal.toLocaleString()}원
          </p>
        </div>
        {namesSet && names.map((name) => (
          <div key={name} className="rounded-[14px] px-4 py-3 flex-1 min-w-[100px]"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{name}</p>
            <p style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {(byPerson[name] ?? 0).toLocaleString()}원
            </p>
          </div>
        ))}
      </div>

      <div className={selectedDate ? 'flex flex-col md:grid gap-4 md:gap-6' : ''} style={selectedDate ? { gridTemplateColumns: '1fr 420px' } : {}}>
        {/* 달력 */}
        <div className="rounded-[18px] p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <CalendarHeader label={label} onPrev={handlePrev} onNext={handleNext} />

          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center py-1" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {d}
              </div>
            ))}
          </div>

          <div className="rounded-[12px] overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < 5 ? '1px solid var(--border-light)' : 'none' }}>
                {week.map((day) => {
                  const dateStr = toDateStr(day)
                  const inMonth = day.getMonth() === currentMonth.getMonth()
                  const today = isToday(day)
                  const selected = selectedDate === dateStr
                  const total = getDayTotal(dateStr)

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(dateStr)}
                      className="flex flex-col items-center justify-start pt-2 pb-2 min-h-[72px] transition-colors"
                      style={{
                        backgroundColor: selected ? 'rgba(0,102,204,0.06)' : 'var(--bg-card)',
                        borderRight: '1px solid var(--border-light)',
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1"
                        style={{
                          backgroundColor: today ? '#0066cc' : selected ? 'rgba(0,102,204,0.12)' : 'transparent',
                          color: today ? '#ffffff' : inMonth ? 'var(--text-primary)' : '#d2d2d7',
                          fontWeight: today || selected ? 600 : 400,
                        }}
                      >
                        {day.getDate()}
                      </span>
                      {total > 0 && (
                        <span style={{ fontSize: '10px', color: '#0066cc', fontWeight: 600 }}>
                          {total >= 10000 ? `${Math.round(total / 1000)}K` : total.toLocaleString()}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 지출 패널 */}
        {selectedDate && (
          <div className="rounded-[18px] p-6 flex flex-col" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', minHeight: '500px' }}>
            <div className="flex items-start justify-between mb-4">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedDateLabel}</p>
              <button
                onClick={() => { setSelectedDate(null); router.replace('/ledger', { scroll: false }) }}
                style={{ fontSize: '20px', color: 'var(--text-secondary)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* 지출 목록 */}
            <div className="flex flex-col gap-2 mb-4 flex-1">
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
                        <button onClick={() => handleEditSave(e.id)}
                          className="px-3 py-1 rounded-full"
                          style={{ fontSize: '13px', fontWeight: 600, backgroundColor: '#0066cc', color: '#fff' }}>
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

            {/* 날짜별 합계 */}
            {entries.length > 0 && (
              <div className="flex justify-between mb-4 px-1" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>합계</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {entries.reduce((s, e) => s + e.amount, 0).toLocaleString()}원
                </span>
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
          </div>
        )}
      </div>

      {/* 카테고리 통계 */}
      {Object.keys(byCategory).length > 0 && (
        <div className="mt-6 rounded-[18px] p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="mb-4" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>카테고리별 지출</p>
          {(() => {
            const max = Math.max(...Object.values(byCategory))
            const CATEGORY_COLORS: Record<string, string> = {
              식사: '#ff6b6b', 카페: '#ffa94d', 영화: '#a9e34b', 쇼핑: '#74c0fc', 숙소: '#da77f2', 기타: '#adb5bd',
            }
            return Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <div key={cat} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{cat}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{amt.toLocaleString()}원</span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: '8px', backgroundColor: 'var(--bg-hover)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(amt / max) * 100}%`, backgroundColor: CATEGORY_COLORS[cat] ?? '#adb5bd' }}
                    />
                  </div>
                </div>
              ))
          })()}
        </div>
      )}
    </main>
  )
}

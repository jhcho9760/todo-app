'use client'

import { useState } from 'react'

export interface Trip {
  id: number
  name: string
  startDate: string
  endDate: string | null
  memo: string
  coverPlaceId: number | null
  places: TripPlace[]
}

export interface TripPlace {
  id: number
  tripId: number
  name: string
  lat: number
  lng: number
  memo: string
  visitedAt: string | null
  photoData: string | null
}

interface Props {
  trip: Trip | null
  onSave: (trip: Trip) => void
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  fontSize: '14px',
  backgroundColor: 'var(--bg-hover)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '8px 12px',
  width: '100%',
  outline: 'none',
  border: 'none',
  boxSizing: 'border-box',
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function parseDate(value: string): Date {
  const parts = value.split('T')[0].split('-')
  if (parts.length === 3) {
    const y = parseInt(parts[0]), m = parseInt(parts[1]) - 1, d = parseInt(parts[2])
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d)
  }
  return new Date()
}

function MiniCalendar({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const initial = value ? parseDate(value) : new Date()
  const [cal, setCal] = useState({ year: initial.getFullYear(), month: initial.getMonth() })

  const firstDay = new Date(cal.year, cal.month, 1).getDay()
  const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const prevMonth = () => setCal(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 })
  const nextMonth = () => setCal(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 })

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>{label}</p>
      <div style={{ backgroundColor: 'var(--bg-hover)', borderRadius: '10px', padding: '10px', fontSize: '13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '16px', padding: '0 4px' }}>‹</button>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cal.year}년 {cal.month + 1}월</span>
          <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '16px', padding: '0 4px' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
          {DAYS.map((d) => <div key={d} style={{ color: 'var(--text-secondary)', fontSize: '11px', padding: '2px 0' }}>{d}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr = `${cal.year}-${String(cal.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isSelected = value === dateStr
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(isSelected ? '' : dateStr)}
                style={{ padding: '4px 0', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: isSelected ? 700 : 400, backgroundColor: isSelected ? '#0066cc' : 'transparent', color: isSelected ? '#fff' : 'var(--text-primary)', fontSize: '13px' }}
              >{day}</button>
            )
          })}
        </div>
        {value && (
          <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>📅 {value}</p>
        )}
      </div>
    </div>
  )
}

export default function TripFormSheet({ trip, onSave, onClose }: Props) {
  const [name, setName] = useState(trip?.name ?? '')
  const [startDate, setStartDate] = useState(trip?.startDate ?? '')
  const [endDate, setEndDate] = useState(trip?.endDate ?? '')
  const [memo, setMemo] = useState(trip?.memo ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !startDate) return
    setSaving(true)
    const body = { name, startDate, endDate: endDate || null, memo }
    let saved: Trip
    if (trip) {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      saved = { ...trip, ...(await res.json()) }
    } else {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      saved = { ...(await res.json()), places: [] }
    }
    setSaving(false)
    onSave(saved)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: 'var(--bg-card)',
      borderRadius: '20px 20px 0 0',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
      zIndex: 20,
      padding: '20px',
      paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
      maxHeight: '80vh',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {trip ? '여행 수정' : '새 여행'}
        </p>
        <button onClick={onClose} style={{ fontSize: '22px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="여행 이름 (예: 제주도 여행)" style={inputStyle} />
      <MiniCalendar value={startDate} onChange={setStartDate} label="시작일" />
      <MiniCalendar value={endDate} onChange={setEndDate} label="종료일 (선택)" />
      <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="한 줄 메모 (선택)" style={inputStyle} />
      <button
        onClick={handleSave}
        disabled={saving || !name || !startDate}
        style={{
          width: '100%', padding: '10px', borderRadius: '100px',
          fontSize: '14px', fontWeight: 600, border: 'none', cursor: (name && startDate) ? 'pointer' : 'default',
          backgroundColor: (name && startDate) ? '#0066cc' : 'var(--bg-hover)',
          color: (name && startDate) ? '#fff' : '#b0b0b5',
        }}
      >
        {saving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}

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
      position: 'absolute', bottom: 0, left: 0, right: 0,
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
      <input value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="시작일 (YYYY-MM-DD)" style={inputStyle} />
      <input value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="종료일 (YYYY-MM-DD, 선택)" style={inputStyle} />
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

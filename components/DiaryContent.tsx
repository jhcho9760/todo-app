'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getMonthGrid, toDateStr, isToday } from '@/lib/calendar'
import CalendarHeader from '@/components/CalendarHeader'

const getDriveImageUrl = (fileId: string) =>
  `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`

const MOODS = [
  { value: 'great', emoji: '😊', label: '최고' },
  { value: 'good', emoji: '🙂', label: '좋음' },
  { value: 'neutral', emoji: '😐', label: '보통' },
  { value: 'bad', emoji: '😔', label: '나쁨' },
  { value: 'awful', emoji: '😢', label: '슬픔' },
  { value: 'heart', emoji: '❤️', label: 'X' },
  { value: 'fire', emoji: '❤️‍🔥', label: 'O' },
]

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface EntryMeta { date: string; mood: string | null }
interface EntryFull { date: string; title: string; content: string; mood: string | null; photos: string[]; updatedAt?: string }

export default function DiaryContent() {
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

  const [entryMetas, setEntryMetas] = useState<EntryMeta[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(dateParam)
  const [entry, setEntry] = useState<EntryFull | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editMood, setEditMood] = useState<string | null>(null)
  const [editPhotos, setEditPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

  const fetchMetas = useCallback(async () => {
    const res = await fetch(`/api/diary?month=${monthKey}`)
    const data = await res.json()
    setEntryMetas(Array.isArray(data) ? data : [])
  }, [monthKey])

  useEffect(() => { fetchMetas() }, [fetchMetas])

  useEffect(() => {
    if (!selectedDate) { setEntry(null); return }
    fetch(`/api/diary/${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        setEntry(data)
        setEditTitle(data?.title ?? '')
        setEditContent(data?.content ?? '')
        setEditMood(data?.mood ?? null)
        setEditPhotos(data?.photos ?? [])
        setDirty(false)
      })
  }, [selectedDate])

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    router.replace(`/diary?date=${dateStr}`, { scroll: false })
  }

  const handleSave = async () => {
    if (!selectedDate) return
    setSaving(true)
    await fetch(`/api/diary/${selectedDate}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, content: editContent, mood: editMood, photos: editPhotos }),
    })
    setSaving(false)
    setDirty(false)
    fetchMetas()
  }

  const handleDelete = async () => {
    if (!selectedDate) return
    await fetch(`/api/diary/${selectedDate}`, { method: 'DELETE' })
    setSelectedDate(null)
    router.replace('/diary', { scroll: false })
    fetchMetas()
  }

  const handlePhotoUpload = async (files: FileList) => {
    setUploading(true)
    const newIds: string[] = []
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/photos', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.fileId) newIds.push(data.fileId)
    }
    const updated = [...editPhotos, ...newIds]
    setEditPhotos(updated)
    setDirty(true)
    setUploading(false)

    // 즉시 저장
    if (selectedDate) {
      await fetch(`/api/diary/${selectedDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent, mood: editMood, photos: updated }),
      })
      fetchMetas()
      setDirty(false)
    }
  }

  const handlePhotoDelete = async (fileId: string) => {
    await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    })
    const updated = editPhotos.filter((id) => id !== fileId)
    setEditPhotos(updated)
    setDirty(true)
  }

  const hasEntry = (dateStr: string) => entryMetas.some((e) => e.date === dateStr)
  const getMood = (dateStr: string) => entryMetas.find((e) => e.date === dateStr)?.mood ?? null

  const grid = getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth())
  const label = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`

  const handlePrev = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const handleNext = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const selectedDateLabel = selectedDate
    ? (() => {
        const [y, m, d] = selectedDate.split('-').map(Number)
        return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
      })()
    : ''

  return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '960px', paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="font-semibold" style={{ fontSize: '34px', color: 'var(--text-primary)', letterSpacing: '-0.28px' }}>
          데이트 달력
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>날짜를 선택해서 일기를 작성하세요</p>
      </div>

      <div className={selectedDate ? 'flex flex-col md:grid gap-4 md:gap-6' : ''} style={selectedDate ? { gridTemplateColumns: '1fr 420px' } : {}}>
        {/* 달력 */}
        <div
          className="rounded-[18px] p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
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
                  const written = hasEntry(dateStr)
                  const mood = getMood(dateStr)
                  const moodEmoji = mood ? MOODS.find((m) => m.value === mood)?.emoji : null

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
                      {written && (
                        moodEmoji
                          ? <span style={{ fontSize: '18px', lineHeight: 1 }}>{moodEmoji}</span>
                          : <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0066cc' }} />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* 기분 범례 */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {MOODS.map(({ emoji, label }) => (
              <span key={label} className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {emoji} {label}
              </span>
            ))}
          </div>
        </div>

        {/* 에디터 */}
        {selectedDate && (
          <div
            className="rounded-[18px] p-6 flex flex-col"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', minHeight: '500px' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{selectedDateLabel}</p>
                {entry?.updatedAt && (
                  <p style={{ fontSize: '11px', color: '#b0b0b5' }}>
                    마지막 수정: {new Date(entry.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setSelectedDate(null); router.replace('/diary', { scroll: false }) }}
                style={{ fontSize: '20px', color: 'var(--text-secondary)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* 제목 입력 */}
            <input
              value={editTitle}
              onChange={(e) => { setEditTitle(e.target.value); setDirty(true) }}
              placeholder="제목"
              className="w-full outline-none mb-3"
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '10px',
              }}
            />

            {/* 기분 선택 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {MOODS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  onClick={() => { setEditMood(editMood === value ? null : value); setDirty(true) }}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-[8px] transition-colors"
                  style={{
                    backgroundColor: editMood === value ? 'rgba(0,102,204,0.1)' : 'var(--bg-hover)',
                    border: editMood === value ? '1px solid rgba(0,102,204,0.3)' : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{emoji}</span>
                  <span style={{ fontSize: '10px', color: editMood === value ? '#0066cc' : 'var(--text-secondary)' }}>{label}</span>
                </button>
              ))}
            </div>

            {/* 텍스트 에디터 */}
            <textarea
              value={editContent}
              onChange={(e) => { setEditContent(e.target.value); setDirty(true) }}
              placeholder="오늘 어떤 하루였나요? 자유롭게 기록하세요..."
              className="flex-1 resize-none outline-none"
              style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
                minHeight: '200px',
              }}
            />

            {/* 사진 섹션 */}
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
              />

              {editPhotos.length > 0 && (
                <div className="flex flex-col gap-3 mb-4">
                  {editPhotos.map((fileId) => (
                    <div key={fileId} className="relative group rounded-[14px] overflow-hidden">
                      <img
                        src={getDriveImageUrl(fileId)}
                        alt=""
                        className="w-full cursor-pointer"
                        style={{ display: 'block' }}
                        onClick={() => setLightboxPhoto(fileId)}
                      />
                      <button
                        onClick={() => handlePhotoDelete(fileId)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '18px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center rounded-full transition-transform active:scale-95"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: uploading ? '#b0b0b5' : '#0066cc',
                  color: '#ffffff',
                  fontSize: '26px',
                  lineHeight: 1,
                }}
              >
                {uploading ? '…' : '+'}
              </button>
            </div>

            {/* 저장/삭제 버튼 */}
            <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
              {entry ? (
                <button
                  onClick={handleDelete}
                  style={{ fontSize: '13px', color: '#ff3b30' }}
                >
                  삭제
                </button>
              ) : <span />}
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="px-5 py-2 rounded-full transition-colors"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: dirty ? '#0066cc' : 'var(--bg-hover)',
                  color: dirty ? '#ffffff' : '#b0b0b5',
                }}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 사진 라이트박스 */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightboxPhoto(null)}
        >
          <img
            src={getDriveImageUrl(lightboxPhoto)}
            alt=""
            className="max-w-full max-h-full rounded-[12px]"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', imageOrientation: 'from-image' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '20px' }}
          >
            ×
          </button>
        </div>
      )}
    </main>
  )
}

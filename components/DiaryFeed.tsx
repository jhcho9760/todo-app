'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const getDriveImageUrl = (fileId: string) =>
  `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`

interface FeedEntry {
  id: number
  date: string
  title: string
  content: string
  mood: string | null
  photos: string[]
  updatedAt: string
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
}

export default function DiaryFeed() {
  const router = useRouter()
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10))
  const dateInputRef = useRef<HTMLInputElement>(null)

  const fetchEntries = async () => {
    setLoading(true)
    const res = await fetch('/api/diary?all=1')
    const data = await res.json()
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchEntries() }, [])

  const handleNewEntry = () => {
    router.push(`/diary/edit?date=${newDate}`)
    setShowDatePicker(false)
  }

  const handleEntryClick = (date: string) => {
    router.push(`/diary/edit?date=${date}`)
  }

  return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '680px', paddingBottom: '100px' }}>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="font-semibold" style={{ fontSize: '34px', color: 'var(--text-primary)', letterSpacing: '-0.28px' }}>
          데이트 달력
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>소중한 순간들을 기록해요</p>
      </div>

      {/* 피드 목록 */}
      {loading ? (
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>불러오는 중...</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <p style={{ fontSize: '48px', marginBottom: '12px' }}>📷</p>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>아직 기록이 없어요</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>+ 버튼을 눌러 첫 일기를 작성해보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => handleEntryClick(entry.date)}
              className="rounded-[18px] overflow-hidden cursor-pointer transition-all"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* 사진 */}
              {entry.photos.length > 0 && (
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img
                    src={getDriveImageUrl(entry.photos[0])}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {entry.photos.length > 1 && (
                    <div
                      className="absolute bottom-2 right-2 px-2 py-1 rounded-full"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)', fontSize: '12px', color: '#fff' }}
                    >
                      +{entry.photos.length - 1}
                    </div>
                  )}
                </div>
              )}

              {/* 텍스트 */}
              <div className="p-4">
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {formatDate(entry.date)}
                </p>
                {entry.title && (
                  <p className="font-semibold mb-1" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                    {entry.title}
                  </p>
                )}
                {entry.content && (
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {entry.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 플로팅 + 버튼 */}
      <button
        onClick={() => setShowDatePicker(true)}
        className="fixed flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
        style={{
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          right: '20px',
          width: '56px',
          height: '56px',
          backgroundColor: '#0066cc',
          color: '#ffffff',
          fontSize: '28px',
          zIndex: 50,
        }}
      >
        +
      </button>

      {/* 날짜 선택 모달 */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDatePicker(false)}
        >
          <div
            className="w-full rounded-t-[24px] p-6 pb-10"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: 'var(--border)' }} />
            <h2 className="font-semibold mb-6" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
              날짜 선택
            </h2>
            <input
              ref={dateInputRef}
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-[12px] px-4 py-3 mb-4 outline-none"
              style={{
                fontSize: '16px',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-hover)',
                border: '1px solid var(--border)',
              }}
            />
            <button
              onClick={handleNewEntry}
              className="w-full py-3 rounded-full font-semibold"
              style={{ backgroundColor: '#0066cc', color: '#ffffff', fontSize: '16px' }}
            >
              일기 작성
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

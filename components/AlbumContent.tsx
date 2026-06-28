'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AlbumEntry { date: string; title: string; photos: string[] }

const getDriveImageUrl = (fileId: string) =>
  `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`

export default function AlbumContent() {
  const [entries, setEntries] = useState<AlbumEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<{ fileId: string; date: string } | null>(null)

  useEffect(() => {
    fetch('/api/album')
      .then((r) => r.json())
      .then((data) => { setEntries(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const totalPhotos = entries.reduce((sum, e) => sum + e.photos.length, 0)

  if (loading) return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '960px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>불러오는 중...</div>
    </main>
  )

  return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '960px', paddingBottom: '80px' }}>
      <div className="mb-8">
        <h1 className="font-semibold" style={{ fontSize: '34px', color: 'var(--text-primary)', letterSpacing: '-0.28px' }}>
          사진 앨범
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {totalPhotos > 0 ? `${entries.length}개의 날, ${totalPhotos}장의 사진` : '아직 사진이 없어요'}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '48px', marginBottom: '12px' }}>📷</span>
          <p style={{ fontSize: '15px', marginBottom: '8px' }}>데이트 일기에 사진을 추가하면 여기에 모여요</p>
          <Link href="/diary" style={{ fontSize: '14px', color: '#ff6b9d' }}>일기 쓰러 가기 →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {entries.map((entry) => {
            const [y, m, d] = entry.date.split('-').map(Number)
            const dateLabel = new Date(y, m - 1, d).toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
            })
            return (
              <div key={entry.date}>
                {/* 날짜 헤더 */}
                <div className="flex items-center gap-3 mb-3">
                  <Link
                    href={`/diary?date=${entry.date}`}
                    className="flex items-center gap-2 group"
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{dateLabel}</span>
                    {entry.title && (
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>— {entry.title}</span>
                    )}
                    <span style={{ fontSize: '12px', color: '#0066cc', opacity: 0 }} className="group-hover:opacity-100 transition-opacity">
                      일기 보기 →
                    </span>
                  </Link>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{entry.photos.length}장</span>
                </div>

                {/* 사진 그리드 */}
                <div
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${Math.min(entry.photos.length, 4)}, 1fr)` }}
                >
                  {entry.photos.map((fileId) => (
                    <button
                      key={fileId}
                      onClick={() => setLightbox({ fileId, date: entry.date })}
                      className="relative overflow-hidden rounded-[10px]"
                      style={{ aspectRatio: '1 / 1', backgroundColor: 'var(--bg-hover)' }}
                    >
                      <img
                        src={getDriveImageUrl(fileId)}
                        alt=""
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        style={{ imageOrientation: 'from-image' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={`https://drive.google.com/thumbnail?id=${lightbox.fileId}&sz=w1200`}
            alt=""
            className="rounded-[12px]"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', imageOrientation: 'from-image' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '20px' }}
          >×</button>
          <Link
            href={`/diary?date=${lightbox.date}`}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px' }}
            onClick={(e) => e.stopPropagation()}
          >
            이 날 일기 보기
          </Link>
        </div>
      )}
    </main>
  )
}

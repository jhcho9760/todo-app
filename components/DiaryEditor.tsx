'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PhotoCollage from '@/components/PhotoCollage'
import { useAuth } from '@/components/AuthProvider'

const MOODS = [
  { value: 'great', emoji: '😊', label: '최고' },
  { value: 'good', emoji: '🙂', label: '좋음' },
  { value: 'neutral', emoji: '😐', label: '보통' },
  { value: 'bad', emoji: '😔', label: '나쁨' },
  { value: 'awful', emoji: '😢', label: '슬픔' },
  { value: 'heart', emoji: '❤️', label: 'X' },
  { value: 'fire', emoji: '❤️‍🔥', label: 'O' },
]

const getDriveImageUrl = (fileId: string) =>
  `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`

interface Entry { date: string; title: string; content: string; mood: string | null; photos: string[]; updatedAt?: string }
interface DiaryComment { id: number; diaryDate: string; author: string; content: string; createdAt: string }

export default function DiaryEditor() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  const [entry, setEntry] = useState<Entry | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [comments, setComments] = useState<DiaryComment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)

  const dateLabel = (() => {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    })
  })()

  useEffect(() => {
    fetch(`/api/diary/${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setEntry(data)
          setTitle(data.title ?? '')
          setContent(data.content ?? '')
          setMood(data.mood ?? null)
          setPhotos(data.photos ?? [])
        }
      })
    fetch(`/api/diary/${date}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
  }, [date])

  const handleCommentSubmit = async () => {
    if (!commentInput.trim()) return
    setCommentSaving(true)
    const res = await fetch(`/api/diary/${date}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentInput.trim(), author: user ?? '' }),
    })
    const created = await res.json()
    setComments((prev) => [...prev, created])
    setCommentInput('')
    setCommentSaving(false)
  }

  const handleCommentDelete = async (id: number) => {
    await fetch(`/api/diary/${date}/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/diary/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, mood, photos, actor: user }),
    })
    setSaving(false)
    setDirty(false)
    router.push(`/diary?date=${date}`)
  }

  const handleDelete = async () => {
    await fetch(`/api/diary/${date}`, { method: 'DELETE' })
    router.push('/diary')
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
    const updated = [...photos, ...newIds]
    setPhotos(updated)
    setDirty(true)
    setUploading(false)

    await fetch(`/api/diary/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, mood, photos: updated }),
    })
  }

  const handlePhotoDelete = async (fileId: string) => {
    await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    })
    setPhotos((prev) => prev.filter((id) => id !== fileId))
    setDirty(true)
  }

  return (
    <main className="px-4 md:px-8 py-6" style={{ maxWidth: '680px', paddingBottom: '100px' }}>
      {/* 상단 네비 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push(`/diary?date=${date}`)}
          className="flex items-center gap-1"
          style={{ fontSize: '16px', color: '#0066cc' }}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path d="M8 2L2 8L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          일기
        </button>
        <div className="flex gap-3">
          {entry && (
            <button onClick={handleDelete} style={{ fontSize: '14px', color: '#ff3b30' }}>
              삭제
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="px-4 py-1.5 rounded-full"
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

      {/* 날짜 */}
      <p className="mb-4" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{dateLabel}</p>

      {/* 기분 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {MOODS.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => { setMood(mood === value ? null : value); setDirty(true) }}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-[8px] transition-colors"
            style={{
              backgroundColor: mood === value ? 'rgba(0,102,204,0.1)' : 'var(--bg-hover)',
              border: mood === value ? '1px solid rgba(0,102,204,0.3)' : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: '20px' }}>{emoji}</span>
            <span style={{ fontSize: '10px', color: mood === value ? '#0066cc' : 'var(--text-secondary)' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* 제목 */}
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
        placeholder="제목"
        className="w-full outline-none mb-4"
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          backgroundColor: 'transparent',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '12px',
        }}
      />

      {/* 내용 */}
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setDirty(true) }}
        placeholder="오늘 어떤 하루였나요? 자유롭게 기록하세요..."
        className="w-full resize-none outline-none mb-6"
        style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: 'var(--text-primary)',
          backgroundColor: 'transparent',
          minHeight: '200px',
        }}
      />

      {/* 사진 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
      />

      {photos.length > 0 && (
        <div className="mb-4">
          <PhotoCollage
            photos={photos}
            onPhotoClick={(id) => setLightbox(id)}
            onPhotoDelete={handlePhotoDelete}
          />
        </div>
      )}

      {/* 사진 추가 버튼 */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 w-full justify-center py-3 rounded-[14px] transition-colors"
        style={{
          fontSize: '15px',
          color: uploading ? '#b0b0b5' : 'var(--text-secondary)',
          backgroundColor: 'var(--bg-hover)',
          border: '1.5px dashed var(--border)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {uploading ? '업로드 중...' : '사진 추가'}
      </button>

      {/* 댓글 섹션 */}
      <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border-light)' }}>
        <p className="mb-3" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>댓글</p>
        {comments.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <div
                  className="flex-1 rounded-[10px] px-3 py-2"
                  style={{ backgroundColor: 'var(--bg-hover)', lineHeight: '1.5' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0066cc' }}>
                      {c.author === 'nayun' ? '🌸 나윤' : c.author === 'junhyung' ? '🦁 준형' : c.author}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(c.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{c.content}</p>
                </div>
                <button
                  onClick={() => handleCommentDelete(c.id)}
                  className="mt-1 w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ fontSize: '18px', color: '#b0b0b5', backgroundColor: 'var(--bg-hover)' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit() } }}
            placeholder="댓글을 입력하세요..."
            className="flex-1 rounded-[10px] px-3 py-2 outline-none"
            style={{
              fontSize: '15px',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-light)',
            }}
          />
          <button
            onClick={handleCommentSubmit}
            disabled={commentSaving || !commentInput.trim()}
            className="px-4 py-2 rounded-[10px]"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: commentInput.trim() ? '#0066cc' : 'var(--bg-hover)',
              color: commentInput.trim() ? '#ffffff' : '#b0b0b5',
            }}
          >
            등록
          </button>
        </div>
      </div>

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={getDriveImageUrl(lightbox)}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
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

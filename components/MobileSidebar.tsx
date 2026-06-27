'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const TODO_ITEMS = [
  { label: '오늘', view: 'today' },
  { label: '다음날', view: 'tomorrow' },
  { label: '주', view: 'week' },
  { label: '월', view: 'month' },
]

const DIARY_ITEMS = [
  { label: '데이트 달력', href: '/diary' },
  { label: '데이트 가계부', href: '/ledger' },
  { label: '여행', href: '/travel' },
]

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentView = searchParams.get('view')
  const isDashboard = pathname === '/' && !currentView
  const [todoOpen, setTodoOpen] = useState(true)
  const [diaryOpen, setDiaryOpen] = useState(true)

  // 라우트 변경 시 닫기
  useEffect(() => { setOpen(false) }, [pathname, currentView])

  return (
    <>
      {/* 햄버거 버튼 — 모바일 전용, 네브바 왼쪽 */}
      <button
        className="md:hidden fixed z-[60] flex items-center justify-center"
        onClick={() => setOpen(true)}
        style={{
          top: 'env(safe-area-inset-top)',
          left: 0,
          width: '44px',
          height: '44px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#ffffff',
        }}
        aria-label="메뉴 열기"
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <line x1="0" y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {/* 오버레이 */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[70]"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* 드로어 */}
      <aside
        className="md:hidden fixed top-0 left-0 bottom-0 z-[80] flex flex-col overflow-y-auto"
        style={{
          width: '220px',
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          paddingBottom: '32px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={() => setOpen(false)}
          style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 10px)', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '20px', lineHeight: 1 }}
        >×</button>

        {/* 대시보드 */}
        <nav className="px-2 mb-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-[8px]"
            style={{
              fontSize: '14px',
              fontWeight: isDashboard ? 600 : 400,
              color: isDashboard ? '#0066cc' : 'var(--text-primary)',
              backgroundColor: isDashboard ? 'rgba(0,102,204,0.1)' : 'transparent',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            대시보드
          </Link>
        </nav>

        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0 12px 12px' }} />

        {/* 업무 To-Do */}
        <SectionHeader label="업무 To-Do" open={todoOpen} onToggle={() => setTodoOpen(!todoOpen)} />
        {todoOpen && (
          <nav className="mt-1 flex flex-col gap-0.5 px-2 mb-3">
            {TODO_ITEMS.map(({ label, view }) => {
              const active = currentView === view && pathname === '/'
              return (
                <Link
                  key={view}
                  href={`/?view=${view}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-[8px]"
                  style={{
                    fontSize: '14px',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#0066cc' : 'var(--text-primary)',
                    backgroundColor: active ? 'rgba(0,102,204,0.1)' : 'transparent',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: active ? '#0066cc' : '#d2d2d7' }} />
                  {label}
                </Link>
              )
            })}
          </nav>
        )}

        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 12px 12px' }} />

        {/* ❤️ 섹션 */}
        <SectionHeader label="❤️" open={diaryOpen} onToggle={() => setDiaryOpen(!diaryOpen)} />
        {diaryOpen && (
          <nav className="mt-1 flex flex-col gap-0.5 px-2">
            {DIARY_ITEMS.map(({ label, href }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-[8px]"
                  style={{
                    fontSize: '14px',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#0066cc' : 'var(--text-primary)',
                    backgroundColor: active ? 'rgba(0,102,204,0.1)' : 'transparent',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: active ? '#0066cc' : '#d2d2d7' }} />
                  {label}
                </Link>
              )
            })}
          </nav>
        )}
      </aside>
    </>
  )
}

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-2">
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#7a7a7a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
        style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: '#7a7a7a' }}>
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

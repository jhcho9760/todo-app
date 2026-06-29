'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'

const TODO_VIEWS = [
  { label: '오늘', view: 'today' },
  { label: '다음날', view: 'tomorrow' },
  { label: '주', view: 'week' },
  { label: '월', view: 'month' },
]

const DIARY_ITEMS = [
  { label: '데이트 달력', href: '/diary' },
  { label: '데이트 가계부', href: '/ledger' },
  { label: '여행 지도', href: '/travel' },
  { label: '여행 계획', href: '/travel?tab=plan' },
  { label: '기념일', href: '/anniversary' },
  { label: '우리 리스트', href: '/wishlist' },
  { label: '사진 앨범', href: '/album' },
]

export default function Sidebar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentView = searchParams.get('view')
  const currentOwner = searchParams.get('owner')
  const currentTab = searchParams.get('tab')
  const isDashboard = pathname === '/' && !currentView
  const isDiary = pathname.startsWith('/diary') || pathname.startsWith('/ledger') || pathname.startsWith('/travel') || pathname.startsWith('/anniversary') || pathname.startsWith('/wishlist') || pathname.startsWith('/album')
  const [nayunOpen, setNayunOpen] = useState(true)
  const [junhyungOpen, setJunhyungOpen] = useState(true)
  const [diaryOpen, setDiaryOpen] = useState(true)

  return (
    <aside
      className="hidden md:flex md:flex-col overflow-y-auto pt-4 pb-8"
      style={{
        position: 'sticky',
        top: 'calc(44px + env(safe-area-inset-top))',
        height: 'calc(100vh - 44px - env(safe-area-inset-top))',
        width: '200px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* 대시보드 링크 */}
      <nav className="px-2 mb-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-[8px] transition-colors"
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

      {/* 나윤's 업무 To-Do */}
      <SectionHeader label="나윤's 업무 To-Do" open={nayunOpen} onToggle={() => setNayunOpen(!nayunOpen)} />
      {nayunOpen && (
        <nav className="mt-1 flex flex-col gap-0.5 px-2 mb-3">
          {TODO_VIEWS.map(({ label, view }) => {
            const active = currentView === view && currentOwner !== 'junhyung' && !isDiary
            return (
              <Link key={view} href={`/?view=${view}&owner=nayun`}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] transition-colors"
                style={{ fontSize: '14px', fontWeight: active ? 600 : 400, color: active ? '#0066cc' : 'var(--text-primary)', backgroundColor: active ? 'rgba(0,102,204,0.1)' : 'transparent' }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: active ? '#0066cc' : '#d2d2d7' }} />
                {label}
              </Link>
            )
          })}
        </nav>
      )}

      <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '4px 12px 12px' }} />

      {/* 준형's 업무 To-Do */}
      <SectionHeader label="준형's 업무 To-Do" open={junhyungOpen} onToggle={() => setJunhyungOpen(!junhyungOpen)} />
      {junhyungOpen && (
        <nav className="mt-1 flex flex-col gap-0.5 px-2 mb-3">
          {TODO_VIEWS.map(({ label, view }) => {
            const active = currentView === view && currentOwner === 'junhyung' && !isDiary
            return (
              <Link key={view} href={`/?view=${view}&owner=junhyung`}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] transition-colors"
                style={{ fontSize: '14px', fontWeight: active ? 600 : 400, color: active ? '#0066cc' : 'var(--text-primary)', backgroundColor: active ? 'rgba(0,102,204,0.1)' : 'transparent' }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: active ? '#0066cc' : '#d2d2d7' }} />
                {label}
              </Link>
            )
          })}
        </nav>
      )}

      <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '4px 12px 12px' }} />

      {/* 데이트 달력 섹션 */}
      <SectionHeader label="❤️" open={diaryOpen} onToggle={() => setDiaryOpen(!diaryOpen)} />
      {diaryOpen && (
        <nav className="mt-1 flex flex-col gap-0.5 px-2">
          {DIARY_ITEMS.map(({ label, href }) => {
            const [hrefPath, hrefQuery] = href.split('?')
            const hrefTab = hrefQuery ? new URLSearchParams(hrefQuery).get('tab') : null
            const active = pathname.startsWith(hrefPath) &&
              (hrefPath !== '/travel' || (hrefTab === 'plan' ? currentTab === 'plan' : currentTab !== 'plan'))
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] transition-colors"
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

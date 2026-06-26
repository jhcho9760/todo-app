'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

const NAV_ITEMS = [
  { label: '오늘',   view: 'today' },
  { label: '다음날', view: 'tomorrow' },
  { label: '주',     view: 'week' },
  { label: '월',     view: 'month' },
]

export default function NavBar() {
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') ?? 'month'
  const { theme, toggle } = useTheme()

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6"
      style={{ backgroundColor: '#000000', height: '44px' }}
    >
      <Link href="/" className="font-normal tracking-[-0.12px]" style={{ fontSize: '12px', color: '#ffffff' }}>
        나윤&apos;s Board
      </Link>

      <div className="flex items-center gap-5">
        {/* 데스크탑 nav 항목 */}
        {NAV_ITEMS.map(({ label, view }) => (
          <Link
            key={view}
            href={`/?view=${view}`}
            className="hidden md:block font-normal tracking-[-0.12px] transition-colors"
            style={{ fontSize: '12px', color: currentView === view ? '#ffffff' : '#7a7a7a' }}
          >
            {label}
          </Link>
        ))}

        {/* 테마 토글 */}
        <button
          onClick={toggle}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{ width: '28px', height: '28px', backgroundColor: 'rgba(255,255,255,0.1)' }}
          title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
        >
          {theme === 'light' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#ffffff" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" fill="#ffffff"/>
              <line x1="12" y1="1" x2="12" y2="3" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="21" x2="12" y2="23" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              <line x1="1" y1="12" x2="3" y2="12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              <line x1="21" y1="12" x2="23" y2="12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
    </nav>
  )
}

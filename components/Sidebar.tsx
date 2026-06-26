'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

const SUB_ITEMS = [
  { label: '오늘', view: 'today' },
  { label: '다음날', view: 'tomorrow' },
  { label: '주', view: 'week' },
  { label: '월', view: 'month' },
]

export default function Sidebar() {
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') ?? 'month'
  const [open, setOpen] = useState(true)

  return (
    <aside
      className="sticky top-[44px] h-[calc(100vh-44px)] flex-shrink-0 overflow-y-auto pt-4 pb-8"
      style={{ width: '200px', backgroundColor: '#f5f5f7', borderRight: '1px solid #e0e0e0' }}
    >
      {/* To-Do 섹션 헤더 */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 group"
      >
        <span
          className="font-semibold tracking-wide uppercase"
          style={{ fontSize: '11px', color: '#7a7a7a', letterSpacing: '0.06em' }}
        >
          To-Do
        </span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s',
            color: '#7a7a7a',
          }}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* 서브메뉴 */}
      {open && (
        <nav className="mt-1 flex flex-col gap-0.5 px-2">
          {SUB_ITEMS.map(({ label, view }) => {
            const active = currentView === view
            return (
              <Link
                key={view}
                href={`/?view=${view}`}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] transition-colors"
                style={{
                  fontSize: '14px',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#0066cc' : '#1d1d1f',
                  backgroundColor: active ? 'rgba(0,102,204,0.1)' : 'transparent',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: active ? '#0066cc' : '#d2d2d7' }}
                />
                {label}
              </Link>
            )
          })}
        </nav>
      )}
    </aside>
  )
}

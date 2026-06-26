'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const NAV_ITEMS = [
  { label: '오늘', view: 'today' },
  { label: '다음날', view: 'tomorrow' },
  { label: '주', view: 'week' },
  { label: '월', view: 'month' },
]

export default function Sidebar() {
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') ?? 'month'

  return (
    <aside
      className="sticky top-[44px] h-[calc(100vh-44px)] flex-shrink-0 pt-6 px-3"
      style={{ width: '180px', backgroundColor: '#f5f5f7', borderRight: '1px solid #e0e0e0' }}
    >
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, view }) => {
          const active = currentView === view
          return (
            <Link
              key={view}
              href={`/?view=${view}`}
              className="flex items-center px-3 py-2 rounded-[10px] transition-colors"
              style={{
                fontSize: '15px',
                fontWeight: active ? 600 : 400,
                color: active ? '#0066cc' : '#1d1d1f',
                backgroundColor: active ? 'rgba(0,102,204,0.1)' : 'transparent',
              }}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

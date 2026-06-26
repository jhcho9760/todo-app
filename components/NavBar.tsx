'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const NAV_ITEMS = [
  { label: '오늘',   view: 'today' },
  { label: '다음날', view: 'tomorrow' },
  { label: '주',     view: 'week' },
  { label: '월',     view: 'month' },
]

export default function NavBar() {
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') ?? 'month'

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6"
      style={{ backgroundColor: '#000000', height: '44px' }}
    >
      <Link
        href="/?view=month"
        className="font-normal tracking-[-0.12px]"
        style={{ fontSize: '12px', color: '#ffffff' }}
      >
        To-Do Board
      </Link>
      <div className="flex items-center gap-5">
        {NAV_ITEMS.map(({ label, view }) => (
          <Link
            key={view}
            href={`/?view=${view}`}
            className="font-normal tracking-[-0.12px] transition-colors"
            style={{
              fontSize: '12px',
              color: currentView === view ? '#ffffff' : '#7a7a7a',
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

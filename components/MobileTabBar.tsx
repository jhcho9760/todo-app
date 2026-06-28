'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'

export default function MobileTabBar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const view = searchParams.get('view')
  const isDiary = pathname.startsWith('/diary')
  const isLedger = pathname.startsWith('/ledger')
  const isTravel = pathname.startsWith('/travel')
  const isBucket = pathname.startsWith('/bucket')
  const isDashboard = pathname === '/' && !view

  const tabs = [
    {
      label: '홈',
      href: '/',
      active: isDashboard,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      label: '오늘',
      href: '/?view=today',
      active: view === 'today' && !isDiary,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="4" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: '주간',
      href: '/?view=week',
      active: view === 'week' && !isDiary,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="4" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="7" y1="13" x2="7" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11" y1="13" x2="11" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="13" x2="15" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: '월간',
      href: '/?view=month',
      active: view === 'month' && !isDiary,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="4" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="11" cy="14" r="1" fill="currentColor" />
          <circle cx="14" cy="14" r="1" fill="currentColor" />
          <circle cx="8" cy="17" r="1" fill="currentColor" />
          <circle cx="11" cy="17" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: '달력',
      href: '/diary',
      active: isDiary,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 19.5C11 19.5 2.5 14 2.5 7.5C2.5 5.01 4.51 3 7 3C8.66 3 10.13 3.9 11 5.23C11.87 3.9 13.34 3 15 3C17.49 3 19.5 5.01 19.5 7.5C19.5 14 11 19.5 11 19.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: '가계부',
      href: '/ledger',
      active: isLedger,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="5" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 9H19" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      ),
    },
    {
      label: '여행',
      href: '/travel',
      active: isTravel,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 17L8 12L12 15L17 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 5H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M4 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="17" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      ),
    },
    {
      label: '버킷',
      href: '/bucket',
      active: isBucket,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 2.5L13.09 8.26L19.18 8.27L14.54 11.74L16.18 17.5L11 14.5L5.82 17.5L7.46 11.74L2.82 8.27L8.91 8.26L11 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-start justify-around px-2"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        height: 'calc(56px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className="flex flex-col items-center gap-0.5 flex-1 pt-2"
          style={{ color: tab.active ? '#0066cc' : 'var(--text-secondary)' }}
        >
          {tab.icon}
          <span style={{ fontSize: '10px', fontWeight: tab.active ? 600 : 400 }}>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}

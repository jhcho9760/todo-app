'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'

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
  const { user, userLabel, logout } = useAuth()
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('unsupported')

  useEffect(() => {
    if (!('Notification' in window)) return
    setNotifStatus(Notification.permission as 'default' | 'granted' | 'denied')
  }, [user])

  const handleNotifClick = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (notifStatus === 'denied') {
      alert('알림이 차단되어 있어요. 브라우저 주소창 왼쪽 🔒 아이콘 → 알림 → 허용으로 변경해주세요.')
      return
    }
    const permission = await Notification.requestPermission()
    setNotifStatus(permission as 'default' | 'granted' | 'denied')
    if (permission !== 'granted') return

    const reg = await navigator.serviceWorker.ready
    const res = await fetch('/api/push')
    const { publicKey } = await res.json()
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
    await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, subscription: sub.toJSON() }),
    })
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6"
      style={{
        backgroundColor: '#000000',
        height: 'calc(44px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: '0px',
      }}
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

        {/* 로그인 유저 + 로그아웃 */}
        {userLabel && (
          <button
            onClick={logout}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ fontSize: '12px', color: '#ffffff' }}
            title="로그아웃"
          >
            <span>{userLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* 알림 설정 */}
        {user && notifStatus !== 'unsupported' && (
          <button
            onClick={handleNotifClick}
            className="flex items-center justify-center rounded-full transition-colors"
            style={{ width: '28px', height: '28px', backgroundColor: 'rgba(255,255,255,0.1)' }}
            title={notifStatus === 'granted' ? '알림 켜짐' : '알림 켜기'}
          >
            {notifStatus === 'granted' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="18" cy="5" r="3" fill="#34c759"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#7a7a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#7a7a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="2" y1="2" x2="22" y2="22" stroke="#7a7a7a" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        )}

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

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

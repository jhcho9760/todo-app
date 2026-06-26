import type { Metadata } from 'next'
import { Suspense } from 'react'
import NavBar from '@/components/NavBar'
import Sidebar from '@/components/Sidebar'
import MobileTabBar from '@/components/MobileTabBar'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: '나윤\'s Board',
  description: '공용 To-Do 보드',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen theme-bg-page">
        <ThemeProvider>
          <Suspense fallback={
            <nav
              className="sticky top-0 z-50 flex items-center px-6"
              style={{ backgroundColor: '#000000', height: '44px' }}
            >
              <span style={{ fontSize: '12px', color: '#ffffff' }}>나윤&apos;s Board</span>
            </nav>
          }>
            <NavBar />
          </Suspense>
          <div className="flex">
            {/* 사이드바: 모바일 숨김, md 이상 표시 */}
            <Suspense fallback={<aside className="hidden md:block" style={{ width: '200px', flexShrink: 0 }} />}>
              <Sidebar />
            </Suspense>
            <div className="flex-1 min-w-0">{children}</div>
          </div>
          {/* 하단 탭바: 모바일 전용 */}
          <Suspense fallback={null}>
            <MobileTabBar />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}

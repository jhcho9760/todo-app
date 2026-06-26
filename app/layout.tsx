import type { Metadata } from 'next'
import { Suspense } from 'react'
import NavBar from '@/components/NavBar'
import Sidebar from '@/components/Sidebar'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: '나윤\'s Board',
  description: '공용 To-Do 보드',
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
            <span style={{ fontSize: '12px', color: '#ffffff' }}>To-Do Board</span>
          </nav>
        }>
          <NavBar />
        </Suspense>
        <div className="flex">
          <Suspense fallback={<aside style={{ width: '200px', flexShrink: 0 }} />}>
            <Sidebar />
          </Suspense>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

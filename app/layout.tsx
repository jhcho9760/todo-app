import type { Metadata } from 'next'
import { Suspense } from 'react'
import NavBar from '@/components/NavBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'To-Do Board',
  description: '공용 To-Do 보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
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
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Suspense } from 'react'
import NavBar from '@/components/NavBar'
import Sidebar from '@/components/Sidebar'
import MobileSidebar from '@/components/MobileSidebar'
import InstallPrompt from '@/components/InstallPrompt'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: "나윤's Board",
  description: '할 일과 데이트 달력을 한곳에서',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "나윤's Board",
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
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
            <Suspense fallback={<aside className="hidden md:block" style={{ width: '200px', flexShrink: 0 }} />}>
              <Sidebar />
            </Suspense>
            <div className="flex-1 min-w-0">{children}</div>
          </div>
          <Suspense fallback={null}>
            <MobileSidebar />
          </Suspense>
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  )
}

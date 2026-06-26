import { Suspense } from 'react'
import HomeContent from '@/components/HomeContent'

export default function Home() {
  return (
    <Suspense fallback={
      <main className="max-w-3xl mx-auto px-4" style={{ paddingBottom: '80px' }}>
        <div className="mx-[-16px] px-8 pt-12 pb-10 mb-8" style={{ backgroundColor: '#1d1d1f' }}>
          <h1 className="font-semibold" style={{ fontSize: '40px', color: '#ffffff' }}>할 일</h1>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}

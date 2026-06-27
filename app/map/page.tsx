import { Suspense } from 'react'
import MapContent from '@/components/MapContent'

export default function MapPage() {
  return (
    <Suspense fallback={
      <main className="px-8 py-10">
        <div style={{ color: '#7a7a7a', fontSize: '14px' }}>지도 불러오는 중...</div>
      </main>
    }>
      <MapContent />
    </Suspense>
  )
}

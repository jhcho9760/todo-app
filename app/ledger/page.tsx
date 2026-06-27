import { Suspense } from 'react'
import LedgerContent from '@/components/LedgerContent'

export default function LedgerPage() {
  return (
    <Suspense fallback={
      <main className="px-8 py-10">
        <div style={{ color: '#7a7a7a', fontSize: '14px' }}>불러오는 중...</div>
      </main>
    }>
      <LedgerContent />
    </Suspense>
  )
}

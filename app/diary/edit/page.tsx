import { Suspense } from 'react'
import DiaryEditor from '@/components/DiaryEditor'

export default function DiaryEditPage() {
  return (
    <Suspense fallback={
      <main className="px-8 py-10">
        <div style={{ color: '#7a7a7a', fontSize: '14px' }}>불러오는 중...</div>
      </main>
    }>
      <DiaryEditor />
    </Suspense>
  )
}

'use client'

import { useSearchParams } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import HomeContent from '@/components/HomeContent'

export default function PageContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view')

  if (!view) return <Dashboard />
  return <HomeContent />
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Todo } from '@/types/todo'
import { toDateStr } from '@/lib/calendar'

const PRIORITY_LABEL: Record<string, string> = { HIGH: '높음', MEDIUM: '중간', LOW: '낮음' }
const PRIORITY_COLOR: Record<string, string> = { HIGH: '#ff3b30', MEDIUM: '#ff9500', LOW: '#7a7a7a' }
const PRIORITY_BG: Record<string, string> = {
  HIGH: 'rgba(255,59,48,0.08)',
  MEDIUM: 'rgba(255,149,0,0.08)',
  LOW: '#f5f5f7',
}

export default function Dashboard() {
  const [todayTodos, setTodayTodos] = useState<Todo[]>([])
  const [allTodos, setAllTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const today = toDateStr(new Date())
  const tomorrow = toDateStr(new Date(new Date().setDate(new Date().getDate() + 1)))

  useEffect(() => {
    const fetchAll = async () => {
      const [todayRes, allRes] = await Promise.all([
        fetch(`/api/todos?dateFrom=${today}&dateTo=${today}`),
        fetch('/api/todos'),
      ])
      const [todayData, allData] = await Promise.all([todayRes.json(), allRes.json()])
      setTodayTodos(Array.isArray(todayData) ? todayData : [])
      setAllTodos(Array.isArray(allData) ? allData : [])
      setLoading(false)
    }
    fetchAll()
  }, [today])

  const total = allTodos.length
  const completed = allTodos.filter((t) => t.completed).length
  const incomplete = total - completed
  const highPriority = allTodos.filter((t) => t.priority === 'HIGH' && !t.completed)
  const todayIncomplete = todayTodos.filter((t) => !t.completed)

  const now = new Date()
  const greeting =
    now.getHours() < 12 ? '좋은 아침이에요' : now.getHours() < 18 ? '안녕하세요' : '수고하셨어요'

  if (loading) {
    return (
      <main className="px-8 py-10" style={{ maxWidth: '900px' }}>
        <div style={{ color: '#7a7a7a', fontSize: '14px' }}>불러오는 중...</div>
      </main>
    )
  }

  return (
    <main className="px-8 py-10" style={{ maxWidth: '900px', paddingBottom: '80px' }}>
      {/* 인사 헤더 */}
      <div className="mb-8">
        <p style={{ fontSize: '15px', color: '#7a7a7a', marginBottom: '6px' }}>{greeting}, 나윤님</p>
        <h1 className="font-semibold" style={{ fontSize: '34px', color: '#1d1d1f', letterSpacing: '-0.28px' }}>
          대시보드
        </h1>
      </div>

      {/* 통계 카드 3개 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="전체 할 일" value={total} sub="개" color="#1d1d1f" />
        <StatCard label="미완료" value={incomplete} sub="개" color="#ff3b30" />
        <StatCard label="완료" value={completed} sub="개" color="#34c759" />
      </div>

      {/* 완료율 바 */}
      {total > 0 && (
        <div
          className="rounded-[18px] p-6 mb-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f' }}>전체 완료율</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0066cc' }}>
              {Math.round((completed / total) * 100)}%
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: '8px', backgroundColor: '#f0f0f0' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(completed / total) * 100}%`, backgroundColor: '#0066cc' }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* 오늘 할 일 */}
        <div
          className="rounded-[18px] p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f' }}>오늘 할 일</h2>
            <Link
              href={`/?view=today&date=${today}`}
              style={{ fontSize: '12px', color: '#0066cc' }}
            >
              전체 보기
            </Link>
          </div>
          {todayIncomplete.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#7a7a7a' }}>오늘 할 일이 없습니다 🎉</p>
          ) : (
            <div className="space-y-2">
              {todayIncomplete.slice(0, 5).map((todo) => (
                <div key={todo.id} className="flex items-start gap-2">
                  <span
                    className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PRIORITY_COLOR[todo.priority] }}
                  />
                  <span
                    className="truncate"
                    style={{ fontSize: '14px', color: '#1d1d1f' }}
                  >
                    {todo.title}
                  </span>
                </div>
              ))}
              {todayIncomplete.length > 5 && (
                <p style={{ fontSize: '12px', color: '#7a7a7a' }}>+{todayIncomplete.length - 5}개 더</p>
              )}
            </div>
          )}
        </div>

        {/* 높은 우선순위 */}
        <div
          className="rounded-[18px] p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f' }}>높은 우선순위</h2>
            <span
              className="px-2 py-0.5 rounded-full"
              style={{ fontSize: '12px', color: '#ff3b30', backgroundColor: 'rgba(255,59,48,0.08)' }}
            >
              {highPriority.length}개
            </span>
          </div>
          {highPriority.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#7a7a7a' }}>없습니다 👍</p>
          ) : (
            <div className="space-y-2">
              {highPriority.slice(0, 5).map((todo) => (
                <div key={todo.id} className="flex items-start gap-2">
                  <span
                    className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: '#ff3b30' }}
                  />
                  <div className="min-w-0">
                    <span className="truncate block" style={{ fontSize: '14px', color: '#1d1d1f' }}>
                      {todo.title}
                    </span>
                    {todo.dueDate && (
                      <span style={{ fontSize: '11px', color: '#7a7a7a' }}>
                        {(() => {
                          const [y, m, d] = todo.dueDate!.split('T')[0].split('-').map(Number)
                          return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                        })()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {highPriority.length > 5 && (
                <p style={{ fontSize: '12px', color: '#7a7a7a' }}>+{highPriority.length - 5}개 더</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 빠른 이동 */}
      <div className="mt-6">
        <h2 className="mb-3" style={{ fontSize: '13px', fontWeight: 600, color: '#7a7a7a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          빠른 이동
        </h2>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: '오늘', href: `/?view=today&date=${today}` },
            { label: '다음날', href: `/?view=tomorrow` },
            { label: '이번 주', href: '/?view=week' },
            { label: '이번 달', href: '/?view=month' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="px-4 py-2 rounded-full transition-colors"
              style={{ fontSize: '14px', color: '#0066cc', backgroundColor: 'rgba(0,102,204,0.08)', border: '1px solid rgba(0,102,204,0.15)' }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div
      className="rounded-[18px] p-5"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
    >
      <p style={{ fontSize: '13px', color: '#7a7a7a', marginBottom: '8px' }}>{label}</p>
      <p className="font-semibold" style={{ fontSize: '32px', color, letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '2px' }}>{sub}</span>
      </p>
    </div>
  )
}

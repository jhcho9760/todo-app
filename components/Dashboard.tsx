'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Todo } from '@/types/todo'
import { toDateStr } from '@/lib/calendar'
import { useAuth } from '@/components/AuthProvider'

const PRIORITY_COLOR: Record<string, string> = { HIGH: '#ff3b30', MEDIUM: '#ff9500', LOW: '#7a7a7a' }
const MOOD_EMOJI: Record<string, string> = { great: '😄', good: '🙂', neutral: '😐', bad: '😔', awful: '😢', heart: '❤️', fire: '❤️‍🔥' }

function getWeatherInfo(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: '맑음', emoji: '☀️' }
  if (code <= 2) return { label: '구름 조금', emoji: '🌤️' }
  if (code === 3) return { label: '흐림', emoji: '☁️' }
  if (code <= 49) return { label: '안개', emoji: '🌫️' }
  if (code <= 59) return { label: '이슬비', emoji: '🌦️' }
  if (code <= 69) return { label: '비', emoji: '🌧️' }
  if (code <= 79) return { label: '눈', emoji: '❄️' }
  if (code <= 84) return { label: '소나기', emoji: '🌧️' }
  if (code <= 99) return { label: '뇌우', emoji: '⛈️' }
  return { label: '알 수 없음', emoji: '🌡️' }
}

interface WeatherData { temp: number; label: string; emoji: string; city: string }
interface DiaryMeta { date: string; mood: string | null; content: string }
interface LedgerSummary { byPerson: Record<string, number>; total: number }

function calcDday(startDate: string): { days: number; label: string } | null {
  if (!startDate) return null
  const [y, m, d] = startDate.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return null
  const days = diff + 1
  const years = Math.floor(diff / 365)
  const label = years > 0 ? `${years}주년 D+${days}` : `D+${days}`
  return { days, label }
}

export default function Dashboard() {
  const { userLabel } = useAuth()
  const [nayunTodos, setNayunTodos] = useState<Todo[]>([])
  const [junhyungTodos, setJunhyungTodos] = useState<Todo[]>([])
  const [allTodos, setAllTodos] = useState<Todo[]>([])
  const [recentDiary, setRecentDiary] = useState<DiaryMeta[]>([])
  const [startDate, setStartDate] = useState('')
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput, setDateInput] = useState('')
  const [monthDateCount, setMonthDateCount] = useState(0)
  const [ledger, setLedger] = useState<LedgerSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [now, setNow] = useState(new Date())

  const today = toDateStr(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      try {
        const [wRes, gRes] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`),
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ko`),
        ])
        const w = await wRes.json()
        const g = await gRes.json()
        const { label, emoji } = getWeatherInfo(w.current?.weather_code ?? 0)
        setWeather({
          temp: Math.round(w.current?.temperature_2m ?? 0),
          label, emoji,
          city: g.address?.city || g.address?.town || g.address?.county || '현재 위치',
        })
      } catch { /* ignore */ }
    })
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      const [todayRes, junhyungTodayRes, allRes, diaryRes, configRes, monthDiaryRes, ledgerRes] = await Promise.all([
        fetch(`/api/todos?dateFrom=${today}&dateTo=${today}&owner=nayun`),
        fetch(`/api/todos?dateFrom=${today}&dateTo=${today}&owner=junhyung`),
        fetch('/api/todos'),
        fetch('/api/diary'),
        fetch('/api/config'),
        fetch(`/api/diary?month=${monthKey}`),
        fetch(`/api/ledger?month=${monthKey}`),
      ])
      const [todayData, junhyungTodayData, allData, diaryData, configData, monthDiaryData, ledgerData] = await Promise.all([
        todayRes.json(), junhyungTodayRes.json(), allRes.json(), diaryRes.json(), configRes.json(), monthDiaryRes.json(), ledgerRes.json(),
      ])
      setNayunTodos(Array.isArray(todayData) ? todayData : [])
      setJunhyungTodos(Array.isArray(junhyungTodayData) ? junhyungTodayData : [])
      setAllTodos(Array.isArray(allData) ? allData : [])
      const metas: DiaryMeta[] = Array.isArray(diaryData) ? diaryData.slice(0, 5) : []
      setRecentDiary(metas)
      setMonthDateCount(Array.isArray(monthDiaryData) ? monthDiaryData.length : 0)
      if (ledgerData?.byPerson) {
        const total = Object.values(ledgerData.byPerson as Record<string, number>).reduce((a, b) => a + b, 0)
        setLedger({ byPerson: ledgerData.byPerson, total })
      }
      const sd = configData?.relationship_start ?? ''
      setStartDate(sd)
      setDateInput(sd)
      setLoading(false)
    }
    fetchAll()
  }, [today])

  const handleSaveStartDate = async () => {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationship_start: dateInput }),
    })
    setStartDate(dateInput)
    setEditingDate(false)
  }

  const total = allTodos.length
  const completed = allTodos.filter((t) => t.completed).length
  const incomplete = total - completed
  const nayunHighPriority = allTodos.filter((t) => t.owner === 'nayun' && t.priority === 'HIGH' && !t.completed)
  const junhyungHighPriority = allTodos.filter((t) => t.owner === 'junhyung' && !t.completed)
  const nayunIncomplete = nayunTodos.filter((t) => !t.completed)
  const junhyungIncomplete = junhyungTodos.filter((t) => !t.completed)
  const dday = calcDday(startDate)

  const hour = now.getHours()
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '수고하셨어요'
  const dateLabel = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  const timeLabel = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  if (loading) return (
    <main className="px-8 py-10" style={{ maxWidth: '900px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>불러오는 중...</div>
    </main>
  )

  return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '960px', paddingBottom: '80px' }}>
      <div className="mb-6 md:mb-8">
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{greeting}, {userLabel}님</p>
        <h1 className="font-semibold" style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-0.28px' }}>대시보드</h1>
      </div>

      {/* 날짜/시간 + 날씨 + D-day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        {/* 날짜/시간 */}
        <div className="rounded-[18px] p-6" style={{ backgroundColor: '#1d1d1f' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>오늘</p>
          <p className="font-semibold" style={{ fontSize: '17px', color: '#ffffff', marginBottom: '4px' }}>{dateLabel}</p>
          <p style={{ fontSize: '28px', fontWeight: 300, color: '#2997ff', fontVariantNumeric: 'tabular-nums' }}>{timeLabel}</p>
        </div>

        {/* 날씨 */}
        {weather && (
          <div className="rounded-[18px] p-6 flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{weather.city} 날씨</p>
                <p className="font-semibold" style={{ fontSize: '40px', lineHeight: 1, color: 'var(--text-primary)' }}>{weather.temp}°</p>
              </div>
              <span style={{ fontSize: '40px', lineHeight: 1 }}>{weather.emoji}</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>{weather.label}</p>
          </div>
        )}

        {/* D-day 카드 */}
        {dday ? (
          <div
            className="rounded-[18px] p-6 flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%)', color: '#ffffff' }}
          >
            <div className="flex items-start justify-between">
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>
                {startDate && (() => {
                  const [y, m, d] = startDate.split('-').map(Number)
                  return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                })()}
              </p>
              <button onClick={() => setEditingDate(true)} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>수정</button>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px' }}>우리 함께한 지</p>
              <p className="font-semibold" style={{ fontSize: '36px', lineHeight: 1, letterSpacing: '-1px' }}>
                {dday.days}<span style={{ fontSize: '18px', fontWeight: 400, marginLeft: '4px' }}>일째 💕</span>
              </p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '6px' }}>{dday.label}</p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-[18px] p-6 flex flex-col items-center justify-center cursor-pointer"
            style={{ border: '2px dashed #ffb3c8', backgroundColor: 'rgba(255,107,157,0.04)' }}
            onClick={() => setEditingDate(true)}
          >
            <span style={{ fontSize: '28px', marginBottom: '8px' }}>💕</span>
            <p style={{ fontSize: '14px', color: '#ff6b9d', fontWeight: 600 }}>연애 시작일 등록</p>
            <p style={{ fontSize: '12px', color: '#ffb3c8', marginTop: '4px' }}>클릭해서 설정하세요</p>
          </div>
        )}
      </div>

      {/* 연애 시작일 입력 모달 */}
      {editingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-[20px] p-6 md:p-8 mx-4 w-full md:w-80" style={{ backgroundColor: 'var(--bg-card)', maxWidth: '320px' }}>
            <h2 className="font-semibold mb-2" style={{ fontSize: '20px', color: 'var(--text-primary)' }}>연애 시작일</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>처음 만난 날을 입력해주세요 💕</p>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full rounded-[11px] px-4 py-3 mb-4"
              style={{ border: '1px solid #e0e0e0', fontSize: '16px', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditingDate(false)}
                className="flex-1 py-3 rounded-full"
                style={{ backgroundColor: '#f5f5f7', fontSize: '15px', color: 'var(--text-primary)' }}
              >취소</button>
              <button
                onClick={handleSaveStartDate}
                disabled={!dateInput}
                className="flex-1 py-3 rounded-full font-semibold"
                style={{ backgroundColor: '#ff6b9d', fontSize: '15px', color: '#ffffff' }}
              >저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 이번 달 요약 */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        {/* 이번 달 데이트 횟수 */}
        <div className="rounded-[18px] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {new Date().getMonth() + 1}월 데이트
          </p>
          <p className="font-semibold" style={{ fontSize: '36px', color: '#ff6b9d', letterSpacing: '-1px', lineHeight: 1 }}>
            {monthDateCount}<span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '4px' }}>회</span>
          </p>
          <Link href="/diary" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>
            달력 보기 →
          </Link>
        </div>

        {/* 이번 달 지출 */}
        <div className="rounded-[18px] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {new Date().getMonth() + 1}월 지출
          </p>
          {ledger ? (
            <>
              <p className="font-semibold" style={{ fontSize: '24px', color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
                {ledger.total.toLocaleString()}<span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '2px' }}>원</span>
              </p>
              <div className="mt-2 flex flex-col gap-0.5">
                {Object.entries(ledger.byPerson).map(([name, amt]) => (
                  <p key={name} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {name} {(amt as number).toLocaleString()}원
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-secondary)' }}>0원</p>
          )}
          <Link href="/ledger" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>
            가계부 보기 →
          </Link>
        </div>
      </div>

      {/* 업무 통계 */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
        <StatCard label="전체 할 일" value={total} color="var(--text-primary)" />
        <StatCard label="미완료" value={incomplete} color="#ff3b30" />
        <StatCard label="완료" value={completed} color="#34c759" />
      </div>

      {total > 0 && (
        <div className="rounded-[18px] p-6 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>전체 완료율</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0066cc' }}>{Math.round((completed / total) * 100)}%</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: '8px', backgroundColor: '#f0f0f0' }}>
            <div className="h-full rounded-full" style={{ width: `${(completed / total) * 100}%`, backgroundColor: '#0066cc' }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 나윤 오늘 할 일 */}
        <div className="rounded-[18px] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>🌸 나윤 오늘 할 일</h2>
            <Link href={`/?view=today&date=${today}&owner=nayun`} style={{ fontSize: '12px', color: '#0066cc' }}>전체 보기</Link>
          </div>
          {nayunIncomplete.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>오늘 할 일이 없습니다 🎉</p>
          ) : (
            <div className="space-y-2">
              {nayunIncomplete.map((todo) => (
                <div key={todo.id} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLOR[todo.priority] }} />
                  <span className="truncate" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{todo.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 준형 오늘 할 일 */}
        <div className="rounded-[18px] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>🦁 준형 오늘 할 일</h2>
            <Link href={`/?view=today&date=${today}&owner=junhyung`} style={{ fontSize: '12px', color: '#0066cc' }}>전체 보기</Link>
          </div>
          {junhyungIncomplete.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>오늘 할 일이 없습니다 🎉</p>
          ) : (
            <div className="space-y-2">
              {junhyungIncomplete.map((todo) => (
                <div key={todo.id} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLOR[todo.priority] }} />
                  <span className="truncate" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{todo.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🌸 나윤 우선순위 */}
        <div className="rounded-[18px] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>🌸 나윤 우선순위</h2>
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '12px', color: '#ff3b30', backgroundColor: 'rgba(255,59,48,0.08)' }}>
              {nayunHighPriority.length}개
            </span>
          </div>
          {nayunHighPriority.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>없습니다 👍</p>
          ) : (
            <div className="space-y-2">
              {nayunHighPriority.map((todo) => (
                <div key={todo.id} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#ff3b30' }} />
                  <div className="min-w-0">
                    <span className="truncate block" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{todo.title}</span>
                    {todo.dueDate && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {(() => { const [y, m, d] = todo.dueDate!.split('T')[0].split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) })()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🦁 준형 우선순위 */}
        <div className="rounded-[18px] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>🦁 준형 우선순위</h2>
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)' }}>
              {junhyungHighPriority.length}개
            </span>
          </div>
          {junhyungHighPriority.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>없습니다 👍</p>
          ) : (
            <div className="space-y-2">
              {junhyungHighPriority.map((todo) => (
                <div key={todo.id} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLOR[todo.priority] }} />
                  <div className="min-w-0">
                    <span className="truncate block" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{todo.title}</span>
                    {todo.dueDate && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {(() => { const [y, m, d] = todo.dueDate!.split('T')[0].split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) })()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 최근 일기 */}
      <div className="rounded-[18px] p-5 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>최근 데이트 기록</h2>
          <Link href="/diary" style={{ fontSize: '12px', color: '#ff6b9d' }}>달력 보기</Link>
        </div>
        {recentDiary.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            아직 기록이 없어요.{' '}
            <Link href="/diary" style={{ color: '#ff6b9d' }}>첫 일기를 써보세요 💕</Link>
          </p>
        ) : (
          <div className="space-y-3">
            {recentDiary.map(({ date, mood }) => {
              const [y, m, d] = date.split('-').map(Number)
              const dateLabel = new Date(y, m - 1, d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
              return (
                <button
                  key={date}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      window.location.href = `/diary/edit?date=${date}`
                    } else {
                      window.location.href = `/diary?date=${date}`
                    }
                  }}
                  className="w-full flex items-center gap-3 py-2 rounded-[10px] px-3 transition-colors hover:bg-[#f5f5f7]"
                >
                  <span style={{ fontSize: '20px' }}>{mood ? MOOD_EMOJI[mood] : '📝'}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{dateLabel}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 빠른 이동 */}
      <div>
        <h2 className="mb-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>빠른 이동</h2>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: '오늘', href: `/?view=today&date=${today}` },
            { label: '다음날', href: '/?view=tomorrow' },
            { label: '이번 주', href: '/?view=week' },
            { label: '이번 달', href: '/?view=month' },
            { label: '데이트 달력', href: '/diary' },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="px-4 py-2 rounded-full transition-colors"
              style={{ fontSize: '14px', color: label === '데이트 달력' ? '#ff6b9d' : '#0066cc', backgroundColor: label === '데이트 달력' ? 'rgba(255,107,157,0.08)' : 'rgba(0,102,204,0.08)', border: `1px solid ${label === '데이트 달력' ? 'rgba(255,107,157,0.2)' : 'rgba(0,102,204,0.15)'}` }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-[14px] md:rounded-[18px] p-3 md:p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</p>
      <p className="font-semibold" style={{ fontSize: '26px', color, letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}<span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '2px' }}>개</span>
      </p>
    </div>
  )
}

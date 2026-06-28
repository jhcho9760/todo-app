'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const USERS = [
  { key: 'nayun', label: '나윤', emoji: '🌸' },
  { key: 'junhyung', label: '준형', emoji: '🦁' },
]

export default function LoginScreen() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pin.length === 4) verifyPin()
  }, [pin])

  const verifyPin = async () => {
    setLoading(true)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: selected, pin }),
    })
    const data = await res.json()
    if (data.ok) {
      localStorage.setItem('currentUser', selected!)
      router.replace('/')
    } else {
      setShake(true)
      setError('PIN이 틀렸어요')
      setPin('')
      setTimeout(() => { setShake(false); setError('') }, 600)
    }
    setLoading(false)
  }

  const handleNum = (n: string) => {
    if (pin.length < 4 && !loading) setPin((p) => p + n)
  }

  const handleDel = () => {
    if (!loading) setPin((p) => p.slice(0, -1))
  }

  if (!selected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: '#000' }}>
        <div className="mb-12 text-center">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>나윤&apos;s Board</p>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>누구세요? 💕</h1>
        </div>
        <div className="flex gap-4">
          {USERS.map((u) => (
            <button
              key={u.key}
              onClick={() => setSelected(u.key)}
              className="flex flex-col items-center gap-3 rounded-[24px] px-10 py-8 transition-transform active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <span style={{ fontSize: '56px' }}>{u.emoji}</span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>{u.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const user = USERS.find((u) => u.key === selected)!

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#000' }}>
      {/* 프로필 */}
      <button onClick={() => { setSelected(null); setPin('') }} className="flex flex-col items-center gap-2 mb-10">
        <span style={{ fontSize: '56px' }}>{user.emoji}</span>
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>{user.label}</span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>탭해서 변경</span>
      </button>

      {/* PIN 도트 */}
      <div className={`flex gap-4 mb-3 ${shake ? 'animate-shake' : ''}`}
        style={{ animation: shake ? 'shake 0.4s ease' : undefined }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-4 h-4 rounded-full transition-colors"
            style={{ backgroundColor: pin.length > i ? '#fff' : 'rgba(255,255,255,0.2)' }} />
        ))}
      </div>

      {error && <p style={{ fontSize: '13px', color: '#ff453a', marginBottom: '8px' }}>{error}</p>}
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>
        {pin.length === 0 ? 'PIN을 입력하세요' : ' '}
      </p>

      {/* 숫자패드 */}
      <div className="grid grid-cols-3 gap-3" style={{ width: '240px' }}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((n, i) => (
          n === '' ? <div key={i} /> :
          <button
            key={i}
            onClick={() => n === '⌫' ? handleDel() : handleNum(n)}
            disabled={loading}
            className="flex items-center justify-center rounded-full transition-colors active:scale-95"
            style={{
              width: '72px', height: '72px',
              backgroundColor: n === '⌫' ? 'transparent' : 'rgba(255,255,255,0.12)',
              fontSize: n === '⌫' ? '24px' : '24px',
              fontWeight: 400,
              color: '#fff',
              border: 'none',
            }}
          >
            {n}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

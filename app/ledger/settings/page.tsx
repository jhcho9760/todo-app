'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LedgerSettingsPage() {
  const router = useRouter()
  const [name1, setName1] = useState('')
  const [name2, setName2] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        setName1(data.ledger_name_1 ?? '')
        setName2(data.ledger_name_2 ?? '')
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ledger_name_1: name1, ledger_name_2: name2 }),
    })
    setSaving(false)
    router.push('/ledger')
  }

  return (
    <main className="px-4 md:px-8 py-6 md:py-10" style={{ maxWidth: '480px' }}>
      <div className="mb-8">
        <h1 className="font-semibold" style={{ fontSize: '28px', color: 'var(--text-primary)' }}>가계부 설정</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>두 사람 이름을 입력해 주세요</p>
      </div>

      <div className="rounded-[18px] p-6 flex flex-col gap-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>첫 번째 이름</label>
          <input
            value={name1}
            onChange={(e) => setName1(e.target.value)}
            placeholder="예: 나윤"
            className="w-full outline-none px-3 py-2 rounded-[8px]"
            style={{ fontSize: '15px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>두 번째 이름</label>
          <input
            value={name2}
            onChange={(e) => setName2(e.target.value)}
            placeholder="예: 지현"
            className="w-full outline-none px-3 py-2 rounded-[8px]"
            style={{ fontSize: '15px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !name1 || !name2}
          className="w-full py-2.5 rounded-full mt-2"
          style={{
            fontSize: '15px',
            fontWeight: 600,
            backgroundColor: name1 && name2 ? '#0066cc' : 'var(--bg-hover)',
            color: name1 && name2 ? '#ffffff' : '#b0b0b5',
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </main>
  )
}

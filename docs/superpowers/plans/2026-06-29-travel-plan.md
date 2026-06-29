# 여행 계획 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 여행 페이지에 "지도" / "계획" 탭을 추가하고, 계획 탭에 날짜별 일정·체크리스트·예산 기능을 구현한다.

**Architecture:** 기존 TravelContent.tsx에 탭 상태를 추가하고, 계획 탭 전체를 별도 컴포넌트 TripPlanTab.tsx로 분리한다. DB는 TripPlace에 dayIndex 필드를 추가하고, TripChecklist·TripExpense 두 테이블을 신설한다.

**Tech Stack:** Next.js 15 App Router, Prisma v7 (PostgreSQL), React, TypeScript

## Global Constraints

- Prisma datasource에 `url` 없음 — 환경변수에서 읽음. 마이그레이션 파일은 수동 SQL로 작성.
- 마이그레이션 파일명 패턴: `prisma/migrations/YYYYMMDDNNNNNN_<name>/migration.sql`
- Prisma client 위치: `app/generated/prisma`
- API route params는 `Promise<{...}>` 형태로 await 필요.
- 모든 입력 fontSize 16px (iOS 자동 확대 방지).
- 스타일은 inline style + CSS 변수(`var(--bg-card)`, `var(--text-primary)` 등) 사용.

---

## 파일 구조

| 파일 | 작업 |
|------|------|
| `prisma/schema.prisma` | TripPlace에 dayIndex 추가, TripChecklist·TripExpense 모델 신설 |
| `prisma/migrations/20260629000000_add_trip_plan/migration.sql` | SQL 마이그레이션 |
| `app/api/trips/[id]/places/[placeId]/route.ts` | PATCH 핸들러 추가 (dayIndex 업데이트) |
| `app/api/trips/[id]/checklists/route.ts` | GET, POST |
| `app/api/trips/[id]/checklists/[checklistId]/route.ts` | PATCH, DELETE |
| `app/api/trips/[id]/expenses/route.ts` | GET, POST |
| `app/api/trips/[id]/expenses/[expenseId]/route.ts` | DELETE |
| `components/TripPlanTab.tsx` | 계획 탭 UI 컴포넌트 (신규) |
| `components/TravelContent.tsx` | 탭 UI 추가, TripPlanTab 연결 |

---

### Task 1: DB 스키마 + 마이그레이션

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260629000000_add_trip_plan/migration.sql`

**Interfaces:**
- Produces: `TripPlace.dayIndex: Int?`, `TripChecklist` 모델, `TripExpense` 모델

- [ ] **Step 1: schema.prisma 수정**

`TripPlace` 모델에 `dayIndex Int?` 추가, `TripChecklist`·`TripExpense` 모델 신설:

```prisma
model TripPlace {
  id        Int      @id @default(autoincrement())
  tripId    Int
  name      String
  lat       Float
  lng       Float
  memo      String   @default("")
  visitedAt String?
  photoData String?
  dayIndex  Int?
  createdAt DateTime @default(now())
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
}

model TripChecklist {
  id       Int     @id @default(autoincrement())
  tripId   Int
  category String
  text     String
  checked  Boolean @default(false)
  trip     Trip    @relation(fields: [tripId], references: [id], onDelete: Cascade)
}

model TripExpense {
  id     Int    @id @default(autoincrement())
  tripId Int
  date   String
  name   String
  amount Int
  trip   Trip   @relation(fields: [tripId], references: [id], onDelete: Cascade)
}
```

`Trip` 모델에 relations 추가:

```prisma
model Trip {
  id           Int             @id @default(autoincrement())
  name         String
  startDate    String
  endDate      String?
  memo         String          @default("")
  coverPlaceId Int?
  createdAt    DateTime        @default(now())
  places       TripPlace[]
  checklists   TripChecklist[]
  expenses     TripExpense[]
}
```

- [ ] **Step 2: 마이그레이션 SQL 파일 생성**

`prisma/migrations/20260629000000_add_trip_plan/migration.sql`:

```sql
ALTER TABLE "TripPlace" ADD COLUMN "dayIndex" INTEGER;

CREATE TABLE "TripChecklist" (
  "id" SERIAL PRIMARY KEY,
  "tripId" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "checked" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "TripChecklist_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE
);

CREATE TABLE "TripExpense" (
  "id" SERIAL PRIMARY KEY,
  "tripId" INTEGER NOT NULL,
  "date" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  CONSTRAINT "TripExpense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE
);
```

- [ ] **Step 3: Prisma client 재생성**

```bash
npx prisma migrate deploy
npx prisma generate
```

Expected: "All migrations have been applied", Prisma client files updated in `app/generated/prisma/`.

- [ ] **Step 4: 커밋**

```bash
git add prisma/schema.prisma prisma/migrations/20260629000000_add_trip_plan/
git commit -m "feat: add TripPlace.dayIndex, TripChecklist, TripExpense schema"
```

---

### Task 2: TripPlace dayIndex API

**Files:**
- Modify: `app/api/trips/[id]/places/[placeId]/route.ts`

**Interfaces:**
- Consumes: Prisma `tripPlace.update`
- Produces: `PATCH /api/trips/[id]/places/[placeId]` — body `{ dayIndex: number | null }` → 200 TripPlace

- [ ] **Step 1: PATCH 핸들러 추가**

기존 파일에 `PATCH` export 추가:

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; placeId: string }> }
) {
  const { placeId } = await params
  const { dayIndex } = await request.json()
  const place = await prisma.tripPlace.update({
    where: { id: Number(placeId) },
    data: { dayIndex: dayIndex ?? null },
  })
  return NextResponse.json(place)
}
```

- [ ] **Step 2: 동작 확인**

서버 실행 후:
```bash
curl -X PATCH http://localhost:3000/api/trips/1/places/1 \
  -H "Content-Type: application/json" \
  -d '{"dayIndex": 1}'
```
Expected: `{"id":1,"dayIndex":1,...}`

- [ ] **Step 3: 커밋**

```bash
git add app/api/trips/[id]/places/[placeId]/route.ts
git commit -m "feat: add PATCH dayIndex to trip place API"
```

---

### Task 3: Checklist API

**Files:**
- Create: `app/api/trips/[id]/checklists/route.ts`
- Create: `app/api/trips/[id]/checklists/[checklistId]/route.ts`

**Interfaces:**
- Produces:
  - `GET /api/trips/[id]/checklists` → `TripChecklist[]`
  - `POST /api/trips/[id]/checklists` body `{ category, text }` → `TripChecklist`
  - `PATCH /api/trips/[id]/checklists/[checklistId]` body `{ checked?, text? }` → `TripChecklist`
  - `DELETE /api/trips/[id]/checklists/[checklistId]` → `{ ok: true }`

- [ ] **Step 1: `app/api/trips/[id]/checklists/route.ts` 생성**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const items = await prisma.tripChecklist.findMany({
    where: { tripId: Number(id) },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(items)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { category, text } = await request.json()
  const item = await prisma.tripChecklist.create({
    data: { tripId: Number(id), category, text },
  })
  return NextResponse.json(item)
}
```

- [ ] **Step 2: `app/api/trips/[id]/checklists/[checklistId]/route.ts` 생성**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  const { checklistId } = await params
  const { checked, text } = await request.json()
  const item = await prisma.tripChecklist.update({
    where: { id: Number(checklistId) },
    data: {
      ...(checked !== undefined && { checked }),
      ...(text !== undefined && { text }),
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  const { checklistId } = await params
  await prisma.tripChecklist.delete({ where: { id: Number(checklistId) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/trips/[id]/checklists/
git commit -m "feat: add checklist CRUD API"
```

---

### Task 4: Expense API

**Files:**
- Create: `app/api/trips/[id]/expenses/route.ts`
- Create: `app/api/trips/[id]/expenses/[expenseId]/route.ts`

**Interfaces:**
- Produces:
  - `GET /api/trips/[id]/expenses` → `TripExpense[]`
  - `POST /api/trips/[id]/expenses` body `{ date, name, amount }` → `TripExpense`
  - `DELETE /api/trips/[id]/expenses/[expenseId]` → `{ ok: true }`

- [ ] **Step 1: `app/api/trips/[id]/expenses/route.ts` 생성**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const items = await prisma.tripExpense.findMany({
    where: { tripId: Number(id) },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  })
  return NextResponse.json(items)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { date, name, amount } = await request.json()
  const item = await prisma.tripExpense.create({
    data: { tripId: Number(id), date, name, amount: Number(amount) },
  })
  return NextResponse.json(item)
}
```

- [ ] **Step 2: `app/api/trips/[id]/expenses/[expenseId]/route.ts` 생성**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const { expenseId } = await params
  await prisma.tripExpense.delete({ where: { id: Number(expenseId) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/trips/[id]/expenses/
git commit -m "feat: add expense CRUD API"
```

---

### Task 5: TripPlanTab 컴포넌트

**Files:**
- Create: `components/TripPlanTab.tsx`

**Interfaces:**
- Consumes:
  - `Trip` (from `./TripFormSheet`): `{ id, name, startDate, endDate, places: TripPlace[] }`
  - `TripPlace` (from `./TripFormSheet`): `{ id, name, dayIndex?: number | null }`
  - API: Tasks 2, 3, 4에서 정의한 엔드포인트
- Produces: `<TripPlanTab trip={Trip} onPlacesChange={() => void} />` — places의 dayIndex가 변경되면 onPlacesChange 호출

- [ ] **Step 1: 타입 및 유틸 정의**

파일 상단:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Trip, TripPlace } from './TripFormSheet'

interface TripChecklist {
  id: number
  tripId: number
  category: string
  text: string
  checked: boolean
}

interface TripExpense {
  id: number
  tripId: number
  date: string
  name: string
  amount: number
}

const CHECKLIST_CATEGORIES = ['준비물', '예약', '숙소', '기타'] as const

function getDayDates(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

const inputStyle: React.CSSProperties = {
  fontSize: '16px',
  backgroundColor: 'var(--bg-hover)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '8px 12px',
  outline: 'none',
  border: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
}
```

- [ ] **Step 2: 컴포넌트 본체 — 상태 및 데이터 로드**

```typescript
interface Props {
  trip: Trip
  onPlacesChange: () => void
}

export default function TripPlanTab({ trip, onPlacesChange }: Props) {
  const [checklists, setChecklists] = useState<TripChecklist[]>([])
  const [expenses, setExpenses] = useState<TripExpense[]>([])
  const [newCheckText, setNewCheckText] = useState<Record<string, string>>({})
  const [expenseForm, setExpenseForm] = useState({ date: trip.startDate ?? '', name: '', amount: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/trips/${trip.id}/checklists`).then(r => r.json()).then(setChecklists)
    fetch(`/api/trips/${trip.id}/expenses`).then(r => r.json()).then(setExpenses)
  }, [trip.id])
```

- [ ] **Step 3: 핸들러 함수**

```typescript
  const assignDay = async (placeId: number, dayIndex: number | null) => {
    await fetch(`/api/trips/${trip.id}/places/${placeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayIndex }),
    })
    onPlacesChange()
  }

  const addChecklist = async (category: string) => {
    const text = newCheckText[category]?.trim()
    if (!text) return
    const item: TripChecklist = await fetch(`/api/trips/${trip.id}/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, text }),
    }).then(r => r.json())
    setChecklists(prev => [...prev, item])
    setNewCheckText(prev => ({ ...prev, [category]: '' }))
  }

  const toggleChecklist = async (item: TripChecklist) => {
    const updated: TripChecklist = await fetch(`/api/trips/${trip.id}/checklists/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !item.checked }),
    }).then(r => r.json())
    setChecklists(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const deleteChecklist = async (id: number) => {
    await fetch(`/api/trips/${trip.id}/checklists/${id}`, { method: 'DELETE' })
    setChecklists(prev => prev.filter(c => c.id !== id))
  }

  const addExpense = async () => {
    const { date, name, amount } = expenseForm
    if (!date || !name || !amount) return
    setSaving(true)
    const item: TripExpense = await fetch(`/api/trips/${trip.id}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, name, amount: Number(amount) }),
    }).then(r => r.json())
    setExpenses(prev => [...prev, item])
    setExpenseForm({ date: trip.startDate ?? '', name: '', amount: '' })
    setSaving(false)
  }

  const deleteExpense = async (id: number) => {
    await fetch(`/api/trips/${trip.id}/expenses/${id}`, { method: 'DELETE' })
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
```

- [ ] **Step 4: 렌더링 — 날짜별 일정 섹션**

```typescript
  const dayDates = trip.startDate && trip.endDate ? getDayDates(trip.startDate, trip.endDate) : []
  const unassignedPlaces = trip.places.filter(p => !p.dayIndex)

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%' }}>

      {/* 날짜별 일정 */}
      {dayDates.length > 0 && (
        <section>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>📅 날짜별 일정</p>

          {/* 미배정 장소 */}
          {unassignedPlaces.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>미배정 장소</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {unassignedPlaces.map(p => (
                  <span key={p.id} style={{ fontSize: '13px', backgroundColor: 'var(--bg-hover)', borderRadius: '100px', padding: '4px 10px', color: 'var(--text-primary)' }}>
                    📍 {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {dayDates.map((date, idx) => {
            const dayNum = idx + 1
            const dayPlaces = trip.places.filter(p => p.dayIndex === dayNum)
            return (
              <div key={date} style={{ marginBottom: '12px', backgroundColor: 'var(--bg-hover)', borderRadius: '12px', padding: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>{dayNum}일차 · {date}</p>
                {dayPlaces.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>장소를 추가하세요</p>
                )}
                {dayPlaces.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', flex: 1, color: 'var(--text-primary)' }}>📍 {p.name}</span>
                    <button
                      onClick={() => assignDay(p.id, null)}
                      style={{ fontSize: '12px', color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}
                    >제거</button>
                  </div>
                ))}
                {unassignedPlaces.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) assignDay(Number(e.target.value), dayNum) }}
                    style={{ ...inputStyle, fontSize: '13px', marginTop: '4px' }}
                  >
                    <option value="">+ 장소 추가</option>
                    {unassignedPlaces.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </section>
      )}
```

- [ ] **Step 5: 렌더링 — 체크리스트 섹션**

```typescript
      {/* 체크리스트 */}
      <section>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>✅ 체크리스트</p>
        {CHECKLIST_CATEGORIES.map(cat => {
          const items = checklists.filter(c => c.category === cat)
          return (
            <div key={cat} style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{cat}</p>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklist(item)}
                    style={{ width: '16px', height: '16px', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)', textDecoration: item.checked ? 'line-through' : 'none', opacity: item.checked ? 0.5 : 1 }}>
                    {item.text}
                  </span>
                  <button onClick={() => deleteChecklist(item.id)} style={{ fontSize: '16px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <input
                  value={newCheckText[cat] ?? ''}
                  onChange={(e) => setNewCheckText(prev => ({ ...prev, [cat]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addChecklist(cat)}
                  placeholder="항목 추가..."
                  style={{ ...inputStyle, flex: 1, fontSize: '14px', padding: '6px 10px' }}
                />
                <button
                  onClick={() => addChecklist(cat)}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                >추가</button>
              </div>
            </div>
          )
        })}
      </section>
```

- [ ] **Step 6: 렌더링 — 예산 섹션**

여행 날짜 목록 생성 (startDate~endDate, 혹은 startDate 하루만):

```typescript
      {/* 예산 */}
      <section style={{ paddingBottom: '120px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>💰 예산</p>

        {/* 날짜별 지출 목록 */}
        {dayDates.length === 0 && expenses.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>아직 지출 내역이 없습니다.</p>
        )}
        {(dayDates.length > 0 ? dayDates : [...new Set(expenses.map(e => e.date))]).map(date => {
          const dayExpenses = expenses.filter(e => e.date === date)
          if (dayExpenses.length === 0 && dayDates.length > 0) return null
          return (
            <div key={date} style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>{date}</p>
              {dayExpenses.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{e.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{e.amount.toLocaleString()}원</span>
                  <button onClick={() => deleteExpense(e.id)} style={{ fontSize: '16px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )
        })}

        {/* 총합 */}
        {expenses.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid var(--border)', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>총 지출</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0066cc' }}>{totalExpense.toLocaleString()}원</span>
          </div>
        )}

        {/* 지출 추가 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--bg-hover)', borderRadius: '12px', padding: '12px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>지출 추가</p>
          <select
            value={expenseForm.date}
            onChange={(e) => setExpenseForm(f => ({ ...f, date: e.target.value }))}
            style={inputStyle}
          >
            {(dayDates.length > 0 ? dayDates : [trip.startDate]).filter(Boolean).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            value={expenseForm.name}
            onChange={(e) => setExpenseForm(f => ({ ...f, name: e.target.value }))}
            placeholder="항목명 (예: 점심식사)"
            style={inputStyle}
          />
          <input
            type="number"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="금액"
            style={inputStyle}
          />
          <button
            onClick={addExpense}
            disabled={saving || !expenseForm.name || !expenseForm.amount}
            style={{
              width: '100%', padding: '10px', borderRadius: '100px',
              fontSize: '14px', fontWeight: 600, border: 'none',
              cursor: (expenseForm.name && expenseForm.amount) ? 'pointer' : 'default',
              backgroundColor: (expenseForm.name && expenseForm.amount) ? '#0066cc' : 'var(--bg-hover)',
              color: (expenseForm.name && expenseForm.amount) ? '#fff' : '#b0b0b5',
            }}
          >
            {saving ? '저장 중...' : '추가'}
          </button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 7: 커밋**

```bash
git add components/TripPlanTab.tsx
git commit -m "feat: add TripPlanTab component with schedule, checklist, expense"
```

---

### Task 6: TravelContent에 탭 UI 연결

**Files:**
- Modify: `components/TravelContent.tsx`
- Modify: `components/TripFormSheet.tsx` (TripPlace 타입에 dayIndex 추가)

**Interfaces:**
- Consumes: `TripPlanTab` from `./TripPlanTab`

- [ ] **Step 1: TripFormSheet.tsx의 TripPlace 타입 수정**

`TripPlace` interface에 `dayIndex` 추가:

```typescript
export interface TripPlace {
  id: number
  tripId: number
  name: string
  lat: number
  lng: number
  memo: string
  visitedAt: string | null
  photoData: string | null
  dayIndex?: number | null
}
```

- [ ] **Step 2: TravelContent.tsx — import 및 탭 상태 추가**

파일 상단 import에 TripPlanTab 추가:

```typescript
import TripPlanTab from './TripPlanTab'
```

`useState` 목록에 탭 상태 추가:

```typescript
const [activeTab, setActiveTab] = useState<'map' | 'plan'>('map')
```

- [ ] **Step 3: 탭 UI 렌더링**

모바일 여행 선택 드롭다운 바로 아래, 데스크톱 검색창 위에 탭 버튼 삽입.
지도 영역(`<div style={{ flex: 1, position: 'relative' ... }}>`) 안의 상단 컨트롤 div 전에:

```typescript
{/* 탭 버튼 (여행 선택 시만 표시) */}
{selectedTrip && (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 11,
    display: 'flex', borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg-card)',
  }}>
    {(['map', 'plan'] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        style={{
          flex: 1, padding: '10px', fontSize: '14px', fontWeight: activeTab === tab ? 600 : 400,
          color: activeTab === tab ? '#0066cc' : 'var(--text-secondary)',
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: activeTab === tab ? '2px solid #0066cc' : '2px solid transparent',
        }}
      >
        {tab === 'map' ? '🗺️ 지도' : '📋 계획'}
      </button>
    ))}
  </div>
)}
```

지도 영역 전체에 탭에 따른 조건부 렌더링 적용:
- 기존 지도 div: `activeTab === 'map'` 일 때만 표시
- 계획 탭: `activeTab === 'plan'` 일 때 표시

지도 영역 div 전체를 다음으로 교체:

```typescript
{/* 지도/계획 영역 */}
<div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

  {/* 탭 버튼 */}
  {selectedTrip && (
    <div style={{
      display: 'flex', borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--bg-card)',
    }}>
      {(['map', 'plan'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          style={{
            flex: 1, padding: '10px', fontSize: '14px', fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? '#0066cc' : 'var(--text-secondary)',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === tab ? '2px solid #0066cc' : '2px solid transparent',
          }}
        >
          {tab === 'map' ? '🗺️ 지도' : '📋 계획'}
        </button>
      ))}
    </div>
  )}

  {/* 지도 탭 */}
  <div style={{ position: 'relative', overflow: 'hidden', height: selectedTrip ? 'calc(100% - 41px)' : '100%', display: activeTab === 'map' || !selectedTrip ? 'block' : 'none' }}>
    {/* 기존 상단 컨트롤, 검색 결과, 지도 div, 안내 메시지 등 그대로 */}
    ...existing map content...
  </div>

  {/* 계획 탭 */}
  {selectedTrip && activeTab === 'plan' && (
    <div style={{ height: 'calc(100% - 41px)', overflowY: 'auto' }}>
      <TripPlanTab
        trip={selectedTrip}
        onPlacesChange={fetchTrips}
      />
    </div>
  )}
</div>
```

> **주의:** 지도 div는 숨길 때 `display: none`이 아닌 `display: 'none'`으로 처리해야 Kakao Map이 마운트 상태를 유지함. 위 코드의 `display: activeTab === 'map' || !selectedTrip ? 'block' : 'none'` 참고.

- [ ] **Step 4: activeTab을 여행 변경 시 'map'으로 초기화**

`handleSelectTrip` 함수에 탭 초기화 추가:

```typescript
const handleSelectTrip = useCallback((tripId: number) => {
  setSelectedTripId(tripId)
  setExpandedTripId((prev) => (prev === tripId ? null : tripId))
  setPanel(null)
  setActiveTab('map')
}, [])
```

- [ ] **Step 5: 앱 실행 후 동작 확인**

```bash
npm run dev
```

확인 항목:
1. 여행 선택 시 "🗺️ 지도" / "📋 계획" 탭 표시
2. 지도 탭: 기존 동작 그대로
3. 계획 탭: 날짜별 일정 (시작일~종료일 있을 때), 체크리스트 4카테고리, 예산 섹션
4. 장소 배정/해제 후 지도 탭으로 돌아가면 반영됨
5. 여행 미선택 시 탭 미표시

- [ ] **Step 6: 커밋**

```bash
git add components/TravelContent.tsx components/TripFormSheet.tsx
git commit -m "feat: add map/plan tabs to travel page"
```

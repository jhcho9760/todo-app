# Calendar View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** To-Do Board에 월간/주간/일간 캘린더 뷰를 추가하고, 전역 nav에 오늘/다음날/주/월 뷰 전환 링크를 배치한다.

**Architecture:** URL 파라미터(`?view=`, `?date=`)로 현재 뷰를 관리한다. `page.tsx`가 파라미터를 읽어 CalendarMonthView / CalendarWeekView / CalendarDayView 중 하나를 렌더링한다. 할 일은 `dueDate` 기준으로 달력에 배치되며, `dueDate`가 없는 항목은 각 뷰 하단 "날짜 미지정" 섹션에 표시한다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Prisma 7 + PostgreSQL (Neon)

## Global Constraints

- TypeScript strict — 모든 파일 타입 안전하게 작성
- Tailwind CSS 사용, 인라인 style은 Apple 디자인 토큰 색상에만 허용
- Apple 디자인 시스템 준수: `#0066cc` Action Blue, `#1d1d1f` ink, `#f5f5f7` parchment, `#e0e0e0` hairline
- `'use client'` 디렉티브는 클라이언트 컴포넌트에만 사용
- 날짜 포맷: `YYYY-MM-DD` 문자열로 통일, Date 객체는 컴포넌트 내부에서만 사용
- 기존 `TodoItem`, `TodoForm` 컴포넌트 재사용

---

## 파일 구조

**신규 생성**
- `components/CalendarHeader.tsx` — 이전/다음 이동 버튼 + 현재 날짜 표시
- `components/CalendarMonthView.tsx` — 월간 그리드
- `components/CalendarWeekView.tsx` — 주간 컬럼
- `components/CalendarDayView.tsx` — 일간 리스트
- `lib/calendar.ts` — 날짜 유틸 함수 (주 시작일 계산, 월 그리드 생성 등)

**수정**
- `app/layout.tsx` — nav에 뷰 전환 링크 추가
- `app/page.tsx` — `?view`, `?date` 파라미터 읽어 뷰 분기
- `app/api/todos/route.ts` — `dateFrom`, `dateTo`, `noDate` 파라미터 추가
- `components/TodoForm.tsx` — `initialDate?: string` prop 추가
- `types/todo.ts` — `Filters`에 `dateFrom`, `dateTo`, `noDate` 추가

---

## Task 1: 날짜 유틸 함수

**Files:**
- Create: `lib/calendar.ts`

**Interfaces:**
- Produces:
  - `toDateStr(date: Date): string` — `YYYY-MM-DD` 반환
  - `getMonthGrid(year: number, month: number): Date[][]` — 6주×7일 2차원 배열 반환 (월간 그리드용)
  - `getWeekDays(date: Date): Date[]` — 해당 날짜가 속한 주의 일~토 7일 배열 반환
  - `isSameDay(a: Date, b: Date): boolean`
  - `isToday(date: Date): boolean`

- [ ] **Step 1: `lib/calendar.ts` 작성**

```typescript
// lib/calendar.ts

export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

// 해당 날짜가 속한 주의 일요일~토요일 반환
export function getWeekDays(date: Date): Date[] {
  const day = date.getDay() // 0=일, 6=토
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

// 월간 달력 그리드 (6주 × 7일)
export function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1)
  const startSunday = new Date(firstDay)
  startSunday.setDate(1 - firstDay.getDay())

  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const d = new Date(startSunday)
      d.setDate(startSunday.getDate() + week * 7 + day)
      return d
    })
  )
}
```

- [ ] **Step 2: 브라우저 콘솔에서 수동 검증**

`npm run dev` 후 브라우저 콘솔에서:
```js
// 확인할 것:
// toDateStr(new Date(2026, 5, 26)) === '2026-06-26'
// getWeekDays(new Date(2026, 5, 26)).length === 7
// getMonthGrid(2026, 5).length === 6
// getMonthGrid(2026, 5)[0].length === 7
```

- [ ] **Step 3: 커밋**

```bash
git add lib/calendar.ts
git commit -m "feat: add calendar date utility functions"
```

---

## Task 2: API 날짜 필터 추가

**Files:**
- Modify: `app/api/todos/route.ts`
- Modify: `types/todo.ts`

**Interfaces:**
- Consumes: 기존 GET `/api/todos` 파라미터 (`search`, `category`, `priority`, `completed`)
- Produces:
  - GET `/api/todos?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD` — dueDate 범위 필터
  - GET `/api/todos?noDate=true` — dueDate가 null인 항목만 반환

- [ ] **Step 1: `types/todo.ts` Filters 타입 확장**

```typescript
// types/todo.ts — Filters 인터페이스만 수정
export interface Filters {
  search: string
  category: string
  priority: string
  completed: string
  dateFrom: string
  dateTo: string
  noDate: string
}
```

- [ ] **Step 2: `app/api/todos/route.ts` GET 핸들러 수정**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateTodoInput } from '@/types/todo'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search    = searchParams.get('search') || ''
  const category  = searchParams.get('category') || ''
  const priority  = searchParams.get('priority') || ''
  const completed = searchParams.get('completed')
  const dateFrom  = searchParams.get('dateFrom')
  const dateTo    = searchParams.get('dateTo')
  const noDate    = searchParams.get('noDate')

  const todos = await prisma.todo.findMany({
    where: {
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(category && { category }),
      ...(priority && { priority }),
      ...(completed !== null && { completed: completed === 'true' }),
      ...(noDate === 'true'
        ? { dueDate: null }
        : {
            ...(dateFrom && { dueDate: { gte: new Date(dateFrom) } }),
            ...(dateTo && { dueDate: { lte: new Date(dateTo + 'T23:59:59') } }),
          }),
    },
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json(
    todos.map((t) => ({ ...t, tags: JSON.parse(t.tags) }))
  )
}

export async function POST(request: NextRequest) {
  const body: CreateTodoInput = await request.json()

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const todo = await prisma.todo.create({
    data: {
      title: body.title.trim(),
      description: body.description ?? null,
      priority: body.priority ?? 'MEDIUM',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      category: body.category ?? null,
      tags: JSON.stringify(body.tags ?? []),
    },
  })

  return NextResponse.json({ ...todo, tags: JSON.parse(todo.tags) }, { status: 201 })
}
```

- [ ] **Step 3: 수동 검증**

`npm run dev` 후:
```
GET /api/todos?dateFrom=2026-06-01&dateTo=2026-06-30
→ dueDate가 6월인 항목만 반환 확인

GET /api/todos?noDate=true
→ dueDate가 null인 항목만 반환 확인
```

- [ ] **Step 4: 커밋**

```bash
git add app/api/todos/route.ts types/todo.ts
git commit -m "feat: add dateFrom/dateTo/noDate filter to todos API"
```

---

## Task 3: TodoForm에 initialDate prop 추가

**Files:**
- Modify: `components/TodoForm.tsx`

**Interfaces:**
- Consumes: 기존 `Props` (`onSubmit`, `initialValues`, `onCancel`)
- Produces: `Props`에 `initialDate?: string` 추가 — 캘린더에서 날짜 클릭 시 dueDate 자동 입력

- [ ] **Step 1: `components/TodoForm.tsx` Props 및 초기값 수정**

`Props` 인터페이스에 `initialDate?: string` 추가하고, `dueDate` state 초기값에 적용:

```typescript
interface Props {
  onSubmit: (data: CreateTodoInput) => void
  initialValues?: Todo
  onCancel?: () => void
  initialDate?: string  // 추가
}
```

컴포넌트 내부 `useState` 부분:
```typescript
const [dueDate, setDueDate] = useState(
  initialValues?.dueDate
    ? initialValues.dueDate.split('T')[0]
    : (initialDate ?? '')  // 수정
)
```

- [ ] **Step 2: 수동 검증**

`npm run dev` 후 `initialDate="2026-06-26"`을 넘겼을 때 날짜 input이 자동으로 채워지는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add components/TodoForm.tsx
git commit -m "feat: add initialDate prop to TodoForm"
```

---

## Task 4: CalendarHeader 컴포넌트

**Files:**
- Create: `components/CalendarHeader.tsx`

**Interfaces:**
- Produces:
```typescript
interface CalendarHeaderProps {
  label: string          // 표시할 텍스트 (예: "2026년 6월", "2026년 6월 4주차")
  onPrev: () => void
  onNext: () => void
}
export default function CalendarHeader(props: CalendarHeaderProps)
```

- [ ] **Step 1: `components/CalendarHeader.tsx` 작성**

```typescript
'use client'

interface Props {
  label: string
  onPrev: () => void
  onNext: () => void
}

export default function CalendarHeader({ label, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrev}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-colors active:scale-95"
        style={{ backgroundColor: 'rgba(210,210,215,0.64)' }}
      >
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path d="M7 1L1 7L7 13" stroke="#1d1d1f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span
        className="font-semibold"
        style={{ fontSize: '21px', lineHeight: '1.19', letterSpacing: '0.231px', color: '#1d1d1f' }}
      >
        {label}
      </span>
      <button
        onClick={onNext}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-colors active:scale-95"
        style={{ backgroundColor: 'rgba(210,210,215,0.64)' }}
      >
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path d="M1 1L7 7L1 13" stroke="#1d1d1f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/CalendarHeader.tsx
git commit -m "feat: add CalendarHeader component"
```

---

## Task 5: CalendarDayView 컴포넌트

**Files:**
- Create: `components/CalendarDayView.tsx`

**Interfaces:**
- Consumes:
  - `TodoItem` from `components/TodoItem.tsx`
  - `TodoForm` from `components/TodoForm.tsx`
  - `Todo`, `CreateTodoInput`, `UpdateTodoInput` from `types/todo`
  - `toDateStr` from `lib/calendar`
- Produces:
```typescript
interface CalendarDayViewProps {
  date: Date
  todos: Todo[]
  noDateTodos: Todo[]
  onUpdate: (id: number, data: UpdateTodoInput) => void
  onDelete: (id: number) => void
  onCreate: (data: CreateTodoInput) => void
}
export default function CalendarDayView(props: CalendarDayViewProps)
```

- [ ] **Step 1: `components/CalendarDayView.tsx` 작성**

```typescript
'use client'

import { useState } from 'react'
import { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { toDateStr, isToday } from '@/lib/calendar'
import TodoItem from './TodoItem'
import TodoForm from './TodoForm'

interface Props {
  date: Date
  todos: Todo[]
  noDateTodos: Todo[]
  onUpdate: (id: number, data: UpdateTodoInput) => void
  onDelete: (id: number) => void
  onCreate: (data: CreateTodoInput) => void
}

export default function CalendarDayView({ date, todos, noDateTodos, onUpdate, onDelete, onCreate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [showNoDate, setShowNoDate] = useState(false)

  const dateLabel = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const handleCreate = (data: CreateTodoInput) => {
    onCreate({ ...data, dueDate: toDateStr(date) })
    setShowForm(false)
  }

  return (
    <div>
      <p className="mb-6" style={{ fontSize: '17px', color: '#7a7a7a', letterSpacing: '-0.374px' }}>
        {dateLabel}
        {isToday(date) && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-white text-xs" style={{ backgroundColor: '#0066cc' }}>
            오늘
          </span>
        )}
      </p>

      {showForm ? (
        <TodoForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          initialDate={toDateStr(date)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-[18px] py-4 text-[17px] font-normal transition-transform active:scale-95 mb-4"
          style={{ border: '1px dashed #e0e0e0', color: '#0066cc', backgroundColor: '#ffffff' }}
        >
          + 새 할 일 추가
        </button>
      )}

      <div
        className="overflow-hidden mb-4"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '18px' }}
      >
        {todos.length === 0 ? (
          <p className="px-5 py-6 text-center" style={{ fontSize: '14px', color: '#7a7a7a' }}>
            이 날의 할 일이 없습니다
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#f0f0f0' }}>
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      {/* 날짜 미지정 섹션 */}
      <div
        className="overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '18px' }}
      >
        <button
          onClick={() => setShowNoDate(!showNoDate)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#7a7a7a' }}>날짜 미지정</span>
          <span style={{ fontSize: '14px', color: '#7a7a7a' }}>{noDateTodos.length}개 {showNoDate ? '▲' : '▼'}</span>
        </button>
        {showNoDate && (
          <div className="divide-y" style={{ borderColor: '#f0f0f0', borderTop: '1px solid #f0f0f0' }}>
            {noDateTodos.length === 0 ? (
              <p className="px-5 py-4" style={{ fontSize: '14px', color: '#7a7a7a' }}>없음</p>
            ) : (
              noDateTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/CalendarDayView.tsx
git commit -m "feat: add CalendarDayView component"
```

---

## Task 6: CalendarWeekView 컴포넌트

**Files:**
- Create: `components/CalendarWeekView.tsx`

**Interfaces:**
- Consumes:
  - `Todo`, `CreateTodoInput`, `UpdateTodoInput` from `types/todo`
  - `toDateStr`, `getWeekDays`, `isSameDay`, `isToday` from `lib/calendar`
  - `CalendarHeader` from `components/CalendarHeader`
  - `TodoItem` from `components/TodoItem`
  - `TodoForm` from `components/TodoForm`
- Produces:
```typescript
interface CalendarWeekViewProps {
  date: Date
  todos: Todo[]
  noDateTodos: Todo[]
  onWeekChange: (date: Date) => void
  onUpdate: (id: number, data: UpdateTodoInput) => void
  onDelete: (id: number) => void
  onCreate: (data: CreateTodoInput) => void
}
export default function CalendarWeekView(props: CalendarWeekViewProps)
```

- [ ] **Step 1: `components/CalendarWeekView.tsx` 작성**

```typescript
'use client'

import { useState } from 'react'
import { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { toDateStr, getWeekDays, isSameDay, isToday } from '@/lib/calendar'
import CalendarHeader from './CalendarHeader'
import TodoItem from './TodoItem'
import TodoForm from './TodoForm'

interface Props {
  date: Date
  todos: Todo[]
  noDateTodos: Todo[]
  onWeekChange: (date: Date) => void
  onUpdate: (id: number, data: UpdateTodoInput) => void
  onDelete: (id: number) => void
  onCreate: (data: CreateTodoInput) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarWeekView({ date, todos, noDateTodos, onWeekChange, onUpdate, onDelete, onCreate }: Props) {
  const [addingDate, setAddingDate] = useState<string | null>(null)
  const [showNoDate, setShowNoDate] = useState(false)
  const days = getWeekDays(date)

  const weekLabel = `${days[0].getFullYear()}년 ${days[0].getMonth() + 1}월 ${Math.ceil(days[0].getDate() / 7)}주차`

  const handlePrev = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 7)
    onWeekChange(d)
  }

  const handleNext = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 7)
    onWeekChange(d)
  }

  const todosForDay = (day: Date) =>
    todos.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day))

  const handleCreate = (data: CreateTodoInput) => {
    onCreate({ ...data, dueDate: addingDate ?? undefined })
    setAddingDate(null)
  }

  return (
    <div>
      <CalendarHeader label={weekLabel} onPrev={handlePrev} onNext={handleNext} />

      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map((day) => {
          const dayTodos = todosForDay(day)
          const todayStyle = isToday(day)
          const dateStr = toDateStr(day)
          return (
            <div key={dateStr}>
              {/* 요일/날짜 헤더 */}
              <div className="text-center mb-2">
                <div
                  className="text-xs mb-1"
                  style={{ color: todayStyle ? '#0066cc' : '#7a7a7a', fontWeight: todayStyle ? 600 : 400 }}
                >
                  {DAY_LABELS[day.getDay()]}
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center mx-auto text-sm font-semibold"
                  style={{
                    backgroundColor: todayStyle ? '#0066cc' : 'transparent',
                    color: todayStyle ? '#ffffff' : '#1d1d1f',
                  }}
                >
                  {day.getDate()}
                </div>
              </div>

              {/* 할 일 목록 */}
              <div
                className="min-h-[80px] p-1 space-y-1"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '11px' }}
              >
                {dayTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="px-2 py-1 rounded text-xs truncate"
                    style={{
                      backgroundColor: todo.completed ? '#f5f5f7' : 'rgba(0,102,204,0.08)',
                      color: todo.completed ? '#7a7a7a' : '#0066cc',
                      textDecoration: todo.completed ? 'line-through' : 'none',
                    }}
                  >
                    {todo.title}
                  </div>
                ))}
                <button
                  onClick={() => setAddingDate(dateStr)}
                  className="w-full text-xs py-1 rounded transition-colors"
                  style={{ color: '#d2d2d7' }}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 추가 폼 */}
      {addingDate && (
        <div className="mb-4">
          <TodoForm
            onSubmit={handleCreate}
            onCancel={() => setAddingDate(null)}
            initialDate={addingDate}
          />
        </div>
      )}

      {/* 날짜 미지정 섹션 */}
      <div
        className="overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '18px' }}
      >
        <button
          onClick={() => setShowNoDate(!showNoDate)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#7a7a7a' }}>날짜 미지정</span>
          <span style={{ fontSize: '14px', color: '#7a7a7a' }}>{noDateTodos.length}개 {showNoDate ? '▲' : '▼'}</span>
        </button>
        {showNoDate && (
          <div className="divide-y" style={{ borderColor: '#f0f0f0', borderTop: '1px solid #f0f0f0' }}>
            {noDateTodos.length === 0 ? (
              <p className="px-5 py-4" style={{ fontSize: '14px', color: '#7a7a7a' }}>없음</p>
            ) : (
              noDateTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/CalendarWeekView.tsx
git commit -m "feat: add CalendarWeekView component"
```

---

## Task 7: CalendarMonthView 컴포넌트

**Files:**
- Create: `components/CalendarMonthView.tsx`

**Interfaces:**
- Consumes:
  - `Todo`, `CreateTodoInput` from `types/todo`
  - `toDateStr`, `getMonthGrid`, `isSameDay`, `isToday` from `lib/calendar`
  - `CalendarHeader` from `components/CalendarHeader`
- Produces:
```typescript
interface CalendarMonthViewProps {
  date: Date
  todos: Todo[]
  noDateTodos: Todo[]
  onMonthChange: (date: Date) => void
  onDayClick: (dateStr: string) => void
}
export default function CalendarMonthView(props: CalendarMonthViewProps)
```

- [ ] **Step 1: `components/CalendarMonthView.tsx` 작성**

```typescript
'use client'

import { useState } from 'react'
import { Todo } from '@/types/todo'
import { toDateStr, getMonthGrid, isSameDay, isToday } from '@/lib/calendar'
import CalendarHeader from './CalendarHeader'

interface Props {
  date: Date
  todos: Todo[]
  noDateTodos: Todo[]
  onMonthChange: (date: Date) => void
  onDayClick: (dateStr: string) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarMonthView({ date, todos, noDateTodos, onMonthChange, onDayClick }: Props) {
  const [showNoDate, setShowNoDate] = useState(false)
  const grid = getMonthGrid(date.getFullYear(), date.getMonth())
  const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`

  const handlePrev = () => {
    const d = new Date(date.getFullYear(), date.getMonth() - 1, 1)
    onMonthChange(d)
  }

  const handleNext = () => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    onMonthChange(d)
  }

  const todosForDay = (day: Date) =>
    todos.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day))

  const isCurrentMonth = (day: Date) => day.getMonth() === date.getMonth()

  return (
    <div>
      <CalendarHeader label={label} onPrev={handlePrev} onNext={handleNext} />

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center py-2 text-xs font-semibold"
            style={{ color: '#7a7a7a' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div
        className="overflow-hidden mb-4"
        style={{ border: '1px solid #e0e0e0', borderRadius: '18px' }}
      >
        {grid.map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7"
            style={{ borderBottom: wi < 5 ? '1px solid #f0f0f0' : 'none' }}
          >
            {week.map((day) => {
              const dayTodos = todosForDay(day)
              const today = isToday(day)
              const currentMonth = isCurrentMonth(day)
              const dateStr = toDateStr(day)
              const MAX_VISIBLE = 2
              const overflow = dayTodos.length - MAX_VISIBLE

              return (
                <button
                  key={dateStr}
                  onClick={() => onDayClick(dateStr)}
                  className="p-2 text-left transition-colors hover:bg-[#f5f5f7] min-h-[80px]"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #f0f0f0',
                  }}
                >
                  {/* 날짜 숫자 */}
                  <div className="mb-1">
                    <span
                      className="w-6 h-6 rounded-full inline-flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: today ? '#0066cc' : 'transparent',
                        color: today ? '#ffffff' : currentMonth ? '#1d1d1f' : '#d2d2d7',
                        fontWeight: today ? 600 : 400,
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* 할 일 칩 */}
                  <div className="space-y-0.5">
                    {dayTodos.slice(0, MAX_VISIBLE).map((todo) => (
                      <div
                        key={todo.id}
                        className="truncate text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: todo.completed ? '#f5f5f7' : 'rgba(0,102,204,0.08)',
                          color: todo.completed ? '#7a7a7a' : '#0066cc',
                        }}
                      >
                        {todo.title}
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="text-xs" style={{ color: '#7a7a7a' }}>
                        +{overflow}개 더
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* 날짜 미지정 섹션 */}
      <div
        className="overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '18px' }}
      >
        <button
          onClick={() => setShowNoDate(!showNoDate)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#7a7a7a' }}>날짜 미지정</span>
          <span style={{ fontSize: '14px', color: '#7a7a7a' }}>{noDateTodos.length}개 {showNoDate ? '▲' : '▼'}</span>
        </button>
        {showNoDate && (
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            {noDateTodos.length === 0 ? (
              <p className="px-5 py-4" style={{ fontSize: '14px', color: '#7a7a7a' }}>없음</p>
            ) : (
              <div className="px-5 py-3 space-y-1">
                {noDateTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="text-sm px-3 py-2 rounded-lg"
                    style={{ backgroundColor: '#f5f5f7', color: '#1d1d1f' }}
                  >
                    {todo.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/CalendarMonthView.tsx
git commit -m "feat: add CalendarMonthView component"
```

---

## Task 8: layout.tsx — nav 링크 추가

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: Next.js `<Link>` 컴포넌트
- Produces: nav 바에 오늘/다음날/주/월 링크

> `layout.tsx`는 서버 컴포넌트. 현재 URL을 읽으려면 클라이언트 컴포넌트로 분리해야 함. `components/NavBar.tsx`를 신규 생성해 `'use client'`로 처리.

- [ ] **Step 1: `components/NavBar.tsx` 작성**

```typescript
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const NAV_ITEMS = [
  { label: '오늘',   view: 'today' },
  { label: '다음날', view: 'tomorrow' },
  { label: '주',     view: 'week' },
  { label: '월',     view: 'month' },
]

export default function NavBar() {
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') ?? 'month'

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6"
      style={{ backgroundColor: '#000000', height: '44px' }}
    >
      <Link
        href="/?view=month"
        className="font-normal tracking-[-0.12px]"
        style={{ fontSize: '12px', color: '#ffffff' }}
      >
        To-Do Board
      </Link>
      <div className="flex items-center gap-5">
        {NAV_ITEMS.map(({ label, view }) => (
          <Link
            key={view}
            href={`/?view=${view}`}
            className="font-normal tracking-[-0.12px] transition-colors"
            style={{
              fontSize: '12px',
              color: currentView === view ? '#ffffff' : '#7a7a7a',
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: `app/layout.tsx` 수정**

```typescript
import type { Metadata } from 'next'
import { Suspense } from 'react'
import NavBar from '@/components/NavBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'To-Do Board',
  description: '공용 To-Do 보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
        <Suspense fallback={
          <nav className="sticky top-0 z-50 flex items-center px-6" style={{ backgroundColor: '#000000', height: '44px' }}>
            <span style={{ fontSize: '12px', color: '#ffffff' }}>To-Do Board</span>
          </nav>
        }>
          <NavBar />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: 수동 검증**

`npm run dev` 후 nav에 오늘/다음날/주/월 링크가 표시되고, 클릭 시 URL이 바뀌며 활성 링크가 흰색으로 표시되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add components/NavBar.tsx app/layout.tsx
git commit -m "feat: add view switch links to global nav"
```

---

## Task 9: page.tsx — 뷰 분기 및 데이터 페칭

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes:
  - `CalendarMonthView` from `components/CalendarMonthView`
  - `CalendarWeekView` from `components/CalendarWeekView`
  - `CalendarDayView` from `components/CalendarDayView`
  - `toDateStr` from `lib/calendar`
  - `Todo`, `CreateTodoInput`, `UpdateTodoInput` from `types/todo`

- [ ] **Step 1: `app/page.tsx` 전체 교체**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { toDateStr } from '@/lib/calendar'
import CalendarMonthView from '@/components/CalendarMonthView'
import CalendarWeekView from '@/components/CalendarWeekView'
import CalendarDayView from '@/components/CalendarDayView'

type View = 'month' | 'week' | 'today' | 'tomorrow'

function getDateForView(view: View, dateParam: string | null): Date {
  if (dateParam) return new Date(dateParam)
  if (view === 'tomorrow') {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
  }
  return new Date()
}

function getDateRange(view: View, date: Date): { dateFrom: string; dateTo: string } | null {
  if (view === 'today' || view === 'tomorrow') {
    const str = toDateStr(date)
    return { dateFrom: str, dateTo: str }
  }
  if (view === 'week') {
    const day = date.getDay()
    const sunday = new Date(date)
    sunday.setDate(date.getDate() - day)
    const saturday = new Date(sunday)
    saturday.setDate(sunday.getDate() + 6)
    return { dateFrom: toDateStr(sunday), dateTo: toDateStr(saturday) }
  }
  if (view === 'month') {
    const first = new Date(date.getFullYear(), date.getMonth(), 1)
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return { dateFrom: toDateStr(first), dateTo: toDateStr(last) }
  }
  return null
}

export default function Home() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const view = (searchParams.get('view') ?? 'month') as View
  const dateParam = searchParams.get('date')

  const [currentDate, setCurrentDate] = useState(() => getDateForView(view, dateParam))
  const [todos, setTodos] = useState<Todo[]>([])
  const [noDateTodos, setNoDateTodos] = useState<Todo[]>([])

  const fetchTodos = useCallback(async () => {
    const range = getDateRange(view, currentDate)

    const [rangeRes, noDateRes] = await Promise.all([
      range
        ? fetch(`/api/todos?dateFrom=${range.dateFrom}&dateTo=${range.dateTo}`)
        : Promise.resolve({ json: async () => [] } as unknown as Response),
      fetch('/api/todos?noDate=true'),
    ])

    const [rangeData, noDateData] = await Promise.all([
      rangeRes.json(),
      noDateRes.json(),
    ])

    setTodos(Array.isArray(rangeData) ? rangeData : [])
    setNoDateTodos(Array.isArray(noDateData) ? noDateData : [])
  }, [view, currentDate])

  useEffect(() => {
    setCurrentDate(getDateForView(view, dateParam))
  }, [view, dateParam])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const handleCreate = async (data: CreateTodoInput) => {
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    fetchTodos()
  }

  const handleUpdate = async (id: number, data: UpdateTodoInput) => {
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    fetchTodos()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    fetchTodos()
  }

  const handleDayClick = (dateStr: string) => {
    router.push(`/?view=today&date=${dateStr}`)
  }

  const headerTitle = view === 'today'
    ? (dateParam ? new Date(dateParam).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '오늘')
    : view === 'tomorrow' ? '다음날'
    : view === 'week' ? '주간'
    : '월간'

  return (
    <main className="max-w-3xl mx-auto px-4" style={{ paddingBottom: '80px' }}>
      {/* 다크 헤더 타일 */}
      <div
        className="mx-[-16px] px-8 pt-12 pb-10 mb-8"
        style={{ backgroundColor: '#1d1d1f' }}
      >
        <h1
          className="font-semibold"
          style={{ fontSize: '40px', lineHeight: '1.1', letterSpacing: '-0.28px', color: '#ffffff' }}
        >
          {headerTitle}
        </h1>
        <p
          className="mt-2 font-normal"
          style={{ fontSize: '17px', lineHeight: '1.47', letterSpacing: '-0.374px', color: '#2997ff' }}
        >
          {todos.filter((t) => !t.completed).length}개 남음
        </p>
      </div>

      {view === 'month' && (
        <CalendarMonthView
          date={currentDate}
          todos={todos}
          noDateTodos={noDateTodos}
          onMonthChange={setCurrentDate}
          onDayClick={handleDayClick}
        />
      )}
      {view === 'week' && (
        <CalendarWeekView
          date={currentDate}
          todos={todos}
          noDateTodos={noDateTodos}
          onWeekChange={setCurrentDate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      )}
      {(view === 'today' || view === 'tomorrow') && (
        <CalendarDayView
          date={currentDate}
          todos={todos}
          noDateTodos={noDateTodos}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 2: `app/page.tsx`를 Suspense로 감싸기**

`page.tsx`는 `useSearchParams`를 사용하므로 Next.js가 Suspense 경계를 요구함. `app/page.tsx`를 아래처럼 분리:

```typescript
// app/page.tsx 최종
'use client'

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
```

Step 1의 전체 코드를 `components/HomeContent.tsx`로 이동.

- [ ] **Step 3: 수동 검증**

```
npm run dev

체크리스트:
- /?view=month → 월간 달력 표시
- /?view=week  → 주간 컬럼 표시
- /?view=today → 오늘 일간 뷰 표시
- /?view=tomorrow → 내일 일간 뷰 표시
- 월간에서 날짜 클릭 → /?view=today&date=YYYY-MM-DD 이동
- 할 일 추가 → 해당 날짜로 등록됨
- 날짜 미지정 섹션 → 클릭 시 접힘/펼침
```

- [ ] **Step 4: 커밋**

```bash
git add app/page.tsx components/HomeContent.tsx
git commit -m "feat: implement calendar view routing with month/week/day views"
```

---

## Task 10: 최종 통합 및 배포

- [ ] **Step 1: 빌드 검증**

```bash
npm run build
```

오류 없이 빌드 완료 확인.

- [ ] **Step 2: GitHub push (Vercel 자동 배포)**

```bash
git push origin master
```

- [ ] **Step 3: Vercel 배포 확인**

Vercel Deployments에서 빌드 성공 확인 후 실제 URL에서 모든 뷰 동작 테스트.

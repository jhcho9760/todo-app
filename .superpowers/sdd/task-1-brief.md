# Task 1: 날짜 유틸 함수

## Context
Next.js 15 + TypeScript To-Do 앱에 캘린더 뷰를 추가하는 작업의 첫 번째 태스크.
이 파일은 이후 모든 캘린더 컴포넌트(CalendarMonthView, CalendarWeekView, CalendarDayView)가 import해서 사용한다.

## Files
- **Create:** `lib/calendar.ts`

## Global Constraints
- TypeScript strict — 모든 타입 명시
- 외부 라이브러리 사용 금지 (날짜 처리는 네이티브 Date API만 사용)
- 날짜 포맷: `YYYY-MM-DD` 문자열로 통일

## Requirements

`lib/calendar.ts`에 아래 함수들을 구현한다:

```typescript
// Date → 'YYYY-MM-DD' 문자열 반환
export function toDateStr(date: Date): string

// 두 Date가 같은 날인지 비교 (시간 무시)
export function isSameDay(a: Date, b: Date): boolean

// date가 오늘인지 확인
export function isToday(date: Date): boolean

// date가 속한 주의 일요일~토요일 7일 Date 배열 반환
export function getWeekDays(date: Date): Date[]

// year년 month월(0-indexed)의 달력 그리드 반환
// 6주 × 7일 2차원 배열 (월 시작 전 날짜와 월 종료 후 날짜 포함)
export function getMonthGrid(year: number, month: number): Date[][]
```

## Implementation

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

export function getWeekDays(date: Date): Date[] {
  const day = date.getDay() // 0=일, 6=토
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - day)
  sunday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

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

## Verification
구현 후 아래를 직접 확인:
- `toDateStr(new Date(2026, 5, 26))` → `'2026-06-26'`
- `getWeekDays(new Date(2026, 5, 26)).length` → `7`
- `getMonthGrid(2026, 5).length` → `6`, `[0].length` → `7`
- `isToday(new Date())` → `true`

## Commit
```bash
git add lib/calendar.ts
git commit -m "feat: add calendar date utility functions"
```

## Report
완료 후 `.superpowers/sdd/task-1-report.md`에 작성:
- 구현 완료 여부
- 커밋 해시
- 검증 결과
- 우려사항 (있으면)

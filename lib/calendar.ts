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

// 할 일이 특정 날짜를 포함하는지 (기간: startDate ~ dueDate, 하루짜리: dueDate)
export function todoCoversDay(
  todo: { startDate: string | null; dueDate: string | null },
  day: Date
): boolean {
  if (!todo.dueDate) return false
  const end = new Date(todo.dueDate)
  const start = todo.startDate ? new Date(todo.startDate) : end
  const target = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return target >= startDay && target <= endDay
}

// 입력된 시작일/종료일을 저장 규칙에 맞게 정규화
// - 하나만 있거나 같으면 하루짜리(startDate=null, dueDate=그 날)
// - 둘 다 있고 다르면 기간(시작<=종료로 정렬)
export function normalizeTodoDates(
  startStr?: string | null,
  endStr?: string | null
): { startDate: Date | null; dueDate: Date | null } {
  const dates = [startStr, endStr]
    .filter((s): s is string => !!s)
    .map((s) => new Date(s))
    .sort((a, b) => a.getTime() - b.getTime())

  if (dates.length === 0) return { startDate: null, dueDate: null }
  if (dates.length === 1) return { startDate: null, dueDate: dates[0] }
  if (dates[0].getTime() === dates[1].getTime()) {
    return { startDate: null, dueDate: dates[1] }
  }
  return { startDate: dates[0], dueDate: dates[1] }
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

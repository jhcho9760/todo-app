'use client'

import { useState } from 'react'
import { Todo, Priority, CreateTodoInput } from '@/types/todo'

interface Props {
  onSubmit: (data: CreateTodoInput) => void
  initialValues?: Todo
  onCancel?: () => void
  initialDate?: string
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH']
const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: "11px",
  padding: "10px 14px",
  fontSize: "17px",
  lineHeight: "1.47",
  letterSpacing: "-0.374px",
  color: "var(--text-primary)",
  backgroundColor: "var(--input-bg)",
  outline: "none",
}

export default function TodoForm({ onSubmit, initialValues, onCancel, initialDate }: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [priority, setPriority] = useState<Priority>(initialValues?.priority ?? 'MEDIUM')
  const [startDate, setStartDate] = useState(
    initialValues?.startDate ? initialValues.startDate.split('T')[0] : ''
  )
  const [dueDate, setDueDate] = useState(
    initialValues?.dueDate
      ? initialValues.dueDate.split('T')[0]
      : (initialDate ?? '')
  )
  const [category, setCategory] = useState(initialValues?.category ?? '')
  const [tagInput, setTagInput] = useState(initialValues?.tags.join(', ') ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      category: category.trim() || undefined,
      tags: tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "18px",
        padding: "20px",
      }}
    >
      <input
        type="text"
        placeholder="할 일 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={inputStyle}
        required
      />
      <textarea
        placeholder="설명 (선택)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ ...inputStyle, resize: "none" }}
        rows={2}
      />
      <div className="flex gap-2 flex-wrap">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          style={{ ...inputStyle, width: "auto" }}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="카테고리"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ ...inputStyle, flex: "1", minWidth: "120px" }}
        />
      </div>
      <div className="flex gap-2 flex-wrap items-end">
        <label className="flex flex-col gap-1" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          시작일 (선택)
          <input
            type="date"
            value={startDate}
            max={dueDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ ...inputStyle, width: "auto" }}
          />
        </label>
        <label className="flex flex-col gap-1" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          종료일
          <input
            type="date"
            value={dueDate}
            min={startDate || undefined}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ ...inputStyle, width: "auto" }}
          />
        </label>
      </div>
      <input
        type="text"
        placeholder="태그 (쉼표로 구분: work, urgent)"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        style={inputStyle}
      />
      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost text-[14px] px-[18px] py-[8px] active:scale-95 transition-transform"
            style={{ fontSize: "14px", padding: "8px 18px" }}
          >
            취소
          </button>
        )}
        <button
          type="submit"
          className="btn-primary active:scale-95 transition-transform"
          style={{ fontSize: "14px", padding: "8px 18px" }}
        >
          {initialValues ? '수정 완료' : '추가'}
        </button>
      </div>
    </form>
  )
}

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

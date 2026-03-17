import type { ContextFilter as ContextFilterType } from '../lib/types'

const filters: { value: ContextFilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
]

interface Props {
  value: ContextFilterType
  onChange: (value: ContextFilterType) => void
}

export function ContextFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-800 p-1">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            value === f.value
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

import { useState } from 'react'
import type { Context, FrequencyType, Task } from '../lib/types'

const frequencyOptions: { value: FrequencyType; label: string; showValue: boolean }[] = [
  { value: 'daily', label: 'Daily', showValue: false },
  { value: 'weekly', label: 'Weekly', showValue: false },
  { value: 'x_per_week', label: 'X times per week', showValue: true },
  { value: 'biweekly', label: 'Every 2 weeks', showValue: false },
  { value: 'monthly', label: 'Monthly', showValue: false },
  { value: 'x_per_month', label: 'X times per month', showValue: true },
  { value: 'custom_days', label: 'Every N days', showValue: true },
]

const contextOptions: { value: Context; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'both', label: 'Both' },
]

interface Props {
  initial?: Task
  onSubmit: (data: {
    name: string
    context: Context
    frequency_type: FrequencyType
    frequency_value: number
  }) => void
  onCancel: () => void
}

export function TaskForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [context, setContext] = useState<Context>(initial?.context ?? 'personal')
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(
    initial?.frequency_type ?? 'daily'
  )
  const [frequencyValue, setFrequencyValue] = useState(
    String(initial?.frequency_value ?? 1)
  )

  const selectedFreq = frequencyOptions.find((f) => f.value === frequencyType)!

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      context,
      frequency_type: frequencyType,
      frequency_value: Math.max(1, parseInt(frequencyValue) || 1),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Practice Italian"
          autoFocus
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">Context</label>
        <div className="flex gap-2">
          {contextOptions.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setContext(opt.value)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                context === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">Frequency</label>
        <select
          value={frequencyType}
          onChange={(e) => setFrequencyType(e.target.value as FrequencyType)}
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {frequencyOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {selectedFreq.showValue && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {frequencyType === 'custom_days' ? 'Every how many days?' : 'How many times?'}
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={frequencyValue}
            onChange={(e) => setFrequencyValue(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-slate-800 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {initial ? 'Save' : 'Add Task'}
        </button>
      </div>
    </form>
  )
}

import { formatFrequency } from '../lib/periods'
import type { AvailableTask } from '../hooks/useAvailableTasks'

const contextColors = {
  work: 'bg-blue-500',
  personal: 'bg-emerald-500',
  both: 'bg-violet-500',
}

interface Props {
  item: AvailableTask
  onComplete: () => void
}

export function TaskCard({ item, onComplete }: Props) {
  const { task, completedCount, requiredCount } = item
  const showProgress = requiredCount > 1

  return (
    <button
      onClick={onComplete}
      className="flex w-full items-center gap-3 rounded-2xl bg-slate-800 px-4 py-4 text-left transition-all active:scale-[0.97] active:bg-slate-700"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-600 transition-colors hover:border-indigo-400">
        <svg
          className="h-5 w-5 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${contextColors[task.context]}`} />
          <span className="truncate font-medium text-slate-100">{task.name}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
          <span>{formatFrequency(task)}</span>
          {showProgress && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-indigo-400">
                {completedCount}/{requiredCount}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}

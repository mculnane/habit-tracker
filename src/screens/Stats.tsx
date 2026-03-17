import { CompletionRing } from '../components/CompletionRing'
import { useStats } from '../hooks/useStats'
import type { Task, Completion } from '../lib/types'

interface Props {
  tasks: Task[]
  completions: Completion[]
}

export function Stats({ tasks, completions }: Props) {
  const stats = useStats(tasks, completions)

  return (
    <div className="flex flex-col gap-8 px-4 pb-24 pt-4">
      <h1 className="text-2xl font-bold text-slate-100">Stats</h1>

      <div className="flex justify-center gap-8">
        <CompletionRing percent={stats.weeklyPercent} label="This Week" />
        <CompletionRing percent={stats.monthlyPercent} label="This Month" />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl bg-slate-800 px-4 py-3">
          <div className="text-sm text-slate-400">Weekly progress</div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {stats.weeklyCompleted} / {stats.weeklyTotal} tasks
          </div>
        </div>
        <div className="rounded-2xl bg-slate-800 px-4 py-3">
          <div className="text-sm text-slate-400">Monthly progress</div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {stats.monthlyCompleted} / {stats.monthlyTotal} tasks
          </div>
        </div>
      </div>
    </div>
  )
}

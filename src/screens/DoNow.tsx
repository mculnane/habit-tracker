import { TaskCard } from '../components/TaskCard'
import { Toast } from '../components/Toast'
import { useAvailableTasks } from '../hooks/useAvailableTasks'
import type { Task, Completion } from '../lib/types'

interface Props {
  tasks: Task[]
  completions: Completion[]
  onComplete: (task: Task) => void
  undoItem: Completion | null
  onUndo: () => void
}

export function DoNow({ tasks, completions, onComplete, undoItem, onUndo }: Props) {
  const available = useAvailableTasks(tasks, completions)

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">What can I do?</h1>
      </div>

      {available.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-400/20">
            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-200">All caught up</p>
          <p className="mt-1 max-w-[16rem] text-sm text-slate-500">
            Nothing left to do right now. Check back later.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {available.map((item) => (
            <TaskCard
              key={item.task.id}
              item={item}
              onComplete={() => onComplete(item.task)}
            />
          ))}
        </div>
      )}

      {undoItem && (
        <Toast message="Task completed" onUndo={onUndo} />
      )}
    </div>
  )
}

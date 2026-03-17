import { useState } from 'react'
import { ContextFilter } from '../components/ContextFilter'
import { TaskCard } from '../components/TaskCard'
import { Toast } from '../components/Toast'
import { useAvailableTasks } from '../hooks/useAvailableTasks'
import type { Task, Completion, ContextFilter as ContextFilterType } from '../lib/types'

interface Props {
  tasks: Task[]
  completions: Completion[]
  onComplete: (task: Task) => void
  undoItem: Completion | null
  onUndo: () => void
}

export function DoNow({ tasks, completions, onComplete, undoItem, onUndo }: Props) {
  const [contextFilter, setContextFilter] = useState<ContextFilterType>('all')
  const available = useAvailableTasks(tasks, completions, contextFilter)

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      <div>
        <h1 className="mb-3 text-2xl font-bold text-slate-100">What can I do?</h1>
        <ContextFilter value={contextFilter} onChange={setContextFilter} />
      </div>

      {available.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 text-5xl">&#10024;</div>
          <p className="text-lg font-medium text-slate-300">All caught up!</p>
          <p className="mt-1 text-sm text-slate-500">
            Nothing left to do right now. Nice work.
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

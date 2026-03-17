import { useMemo } from 'react'
import { isTaskAvailable, getCompletionCount, getRequiredCount } from '../lib/periods'
import type { Task, Completion, ContextFilter } from '../lib/types'

export interface AvailableTask {
  task: Task
  completedCount: number
  requiredCount: number
}

export function useAvailableTasks(
  tasks: Task[],
  completions: Completion[],
  contextFilter: ContextFilter
) {
  return useMemo(() => {
    const now = new Date()

    return tasks
      .filter((task) => {
        if (!isTaskAvailable(task, completions, now)) return false
        if (contextFilter === 'all') return true
        return task.context === contextFilter || task.context === 'both'
      })
      .map((task) => ({
        task,
        completedCount: getCompletionCount(task, completions, now),
        requiredCount: getRequiredCount(task),
      }))
  }, [tasks, completions, contextFilter])
}

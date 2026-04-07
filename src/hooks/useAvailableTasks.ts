import { useMemo } from 'react'
import { isTaskAvailable, getCompletionCount, getRequiredCount } from '../lib/periods'
import { getDeadlinePressure, type PressureLevel } from '../lib/deadlinePressure'
import { sortByUrgency } from '../lib/sortTasks'
import type { Task, Completion, ContextFilter } from '../lib/types'

export interface AvailableTask {
  task: Task
  completedCount: number
  requiredCount: number
  pressure: PressureLevel
}

export function useAvailableTasks(
  tasks: Task[],
  completions: Completion[],
  contextFilter: ContextFilter
) {
  return useMemo(() => {
    const now = new Date()

    const mapped = tasks
      .filter((task) => {
        if (!isTaskAvailable(task, completions, now)) return false
        if (contextFilter === 'all') return true
        return task.context === contextFilter || task.context === 'both'
      })
      .map((task) => ({
        task,
        completedCount: getCompletionCount(task, completions, now),
        requiredCount: getRequiredCount(task),
        pressure: getDeadlinePressure(task, completions, now),
      }))

    return sortByUrgency(mapped)
  }, [tasks, completions, contextFilter])
}

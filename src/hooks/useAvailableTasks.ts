import { useMemo } from 'react'
import { isTaskAvailable, getCompletionCount, getRequiredCount } from '../lib/periods'
import { getUrgencyScore } from '../lib/deadlinePressure'
import { sortByUrgency } from '../lib/sortTasks'
import type { Task, Completion } from '../lib/types'

export interface AvailableTask {
  task: Task
  completedCount: number
  requiredCount: number
  urgencyScore: number
}

export function useAvailableTasks(
  tasks: Task[],
  completions: Completion[]
) {
  return useMemo(() => {
    const now = new Date()

    const mapped = tasks
      .filter((task) => isTaskAvailable(task, completions, now))
      .map((task) => ({
        task,
        completedCount: getCompletionCount(task, completions, now),
        requiredCount: getRequiredCount(task),
        urgencyScore: getUrgencyScore(task, completions, now),
      }))

    return sortByUrgency(mapped)
  }, [tasks, completions])
}

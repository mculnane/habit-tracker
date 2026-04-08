import type { Task } from './types'

/**
 * Returns a numeric urgency weight for sorting. Lower = more urgent (should appear first).
 * Used for plain Task[] sorting (e.g. Manage screen) where completion data isn't available.
 */
function getUrgencyWeight(task: Task): number {
  switch (task.frequency_type) {
    case 'daily':
      return 1
    case 'x_per_week':
      // Higher frequency_value = more urgent → lower weight
      // 7x/week ≈ daily (weight ~1.5), 1x/week = weight ~6
      return 2 + (7 - task.frequency_value)
    case 'weekly':
      return 10
    case 'custom_days':
      // Lower frequency_value (every 2 days) = more urgent than higher (every 30 days)
      return 10 + task.frequency_value
    case 'biweekly':
      return 50
    case 'x_per_month':
      // Higher frequency_value = more urgent
      return 60 + (30 - task.frequency_value)
    case 'monthly':
      return 100
  }
}

export function sortByUrgency<T extends { task: Task; urgencyScore?: number }>(items: T[]): T[]
export function sortByUrgency(items: Task[]): Task[]
export function sortByUrgency(items: (Task | { task: Task; urgencyScore?: number })[]): (Task | { task: Task; urgencyScore?: number })[] {
  return [...items].sort((a, b) => {
    const hasScore = 'urgencyScore' in a && 'urgencyScore' in b
    if (hasScore) {
      // Sort by urgency score descending (higher = more urgent = first)
      const scoreA = (a as { urgencyScore?: number }).urgencyScore ?? 0
      const scoreB = (b as { urgencyScore?: number }).urgencyScore ?? 0
      const scoreDiff = scoreB - scoreA
      if (scoreDiff !== 0) return scoreDiff
    } else {
      // Fallback to static frequency weight for plain Task[] (Manage screen)
      const taskA = 'task' in a ? a.task : a
      const taskB = 'task' in b ? b.task : b
      const weightDiff = getUrgencyWeight(taskA) - getUrgencyWeight(taskB)
      if (weightDiff !== 0) return weightDiff
    }

    const taskA = 'task' in a ? a.task : a
    const taskB = 'task' in b ? b.task : b
    return taskA.name.localeCompare(taskB.name)
  })
}

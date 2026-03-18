import type { Task } from './types'

/**
 * Returns a numeric urgency weight for sorting. Lower = more urgent (should appear first).
 * Normalizes all frequencies to approximate "times per month" then inverts.
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

export function sortByUrgency<T extends { task: Task }>(items: T[]): T[]
export function sortByUrgency(items: Task[]): Task[]
export function sortByUrgency(items: (Task | { task: Task })[]): (Task | { task: Task })[] {
  return [...items].sort((a, b) => {
    const taskA = 'task' in a ? a.task : a
    const taskB = 'task' in b ? b.task : b
    const weightDiff = getUrgencyWeight(taskA) - getUrgencyWeight(taskB)
    if (weightDiff !== 0) return weightDiff
    return taskA.name.localeCompare(taskB.name)
  })
}

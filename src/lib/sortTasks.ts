import type { Task } from './types'
import type { PressureLevel } from './deadlinePressure'

const pressureOrder: Record<PressureLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
}

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

export function sortByUrgency<T extends { task: Task; pressure?: PressureLevel }>(items: T[]): T[]
export function sortByUrgency(items: Task[]): Task[]
export function sortByUrgency(items: (Task | { task: Task; pressure?: PressureLevel })[]): (Task | { task: Task; pressure?: PressureLevel })[] {
  return [...items].sort((a, b) => {
    const taskA = 'task' in a ? a.task : a
    const taskB = 'task' in b ? b.task : b
    const weightDiff = getUrgencyWeight(taskA) - getUrgencyWeight(taskB)
    if (weightDiff !== 0) return weightDiff

    const pressureA = 'pressure' in a ? a.pressure ?? 'none' : 'none'
    const pressureB = 'pressure' in b ? b.pressure ?? 'none' : 'none'
    const pressureDiff = pressureOrder[pressureA] - pressureOrder[pressureB]
    if (pressureDiff !== 0) return pressureDiff

    return taskA.name.localeCompare(taskB.name)
  })
}

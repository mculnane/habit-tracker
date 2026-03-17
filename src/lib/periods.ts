import { getISOWeek, getISOWeekYear, format, getDayOfYear } from 'date-fns'
import type { Task, Completion, FrequencyType } from './types'

export function getPeriodKey(
  frequencyType: FrequencyType,
  frequencyValue: number,
  date: Date
): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date)

  switch (frequencyType) {
    case 'daily':
      return format(date, 'yyyy-MM-dd')

    case 'weekly':
    case 'x_per_week':
      return `${year}-W${String(week).padStart(2, '0')}`

    case 'biweekly': {
      const biweek = Math.floor((week - 1) / 2)
      return `${year}-BW${String(biweek).padStart(2, '0')}`
    }

    case 'monthly':
    case 'x_per_month':
      return format(date, 'yyyy-MM')

    case 'custom_days': {
      const dayOfYear = getDayOfYear(date)
      const interval = Math.floor((dayOfYear - 1) / frequencyValue)
      return `${date.getFullYear()}-CD${String(interval).padStart(3, '0')}`
    }
  }
}

export function getRequiredCount(task: Task): number {
  switch (task.frequency_type) {
    case 'x_per_week':
    case 'x_per_month':
      return task.frequency_value
    default:
      return 1
  }
}

export function isTaskAvailable(task: Task, completions: Completion[], date: Date = new Date()): boolean {
  if (!task.is_active) return false

  const periodKey = getPeriodKey(task.frequency_type, task.frequency_value, date)
  const completionsInPeriod = completions.filter(
    (c) => c.task_id === task.id && c.period_key === periodKey
  )

  // Period quota already met — fully done for this period
  if (completionsInPeriod.length >= getRequiredCount(task)) return false

  // For multi-per-period tasks (x_per_week, x_per_month), hide until tomorrow
  // if already completed today — you wouldn't do the same habit twice in one day
  if (task.frequency_type === 'x_per_week' || task.frequency_type === 'x_per_month') {
    const today = format(date, 'yyyy-MM-dd')
    const completedToday = completions.some(
      (c) => c.task_id === task.id && c.completed_at.startsWith(today)
    )
    if (completedToday) return false
  }

  return true
}

export function getCompletionCount(task: Task, completions: Completion[], date: Date = new Date()): number {
  const periodKey = getPeriodKey(task.frequency_type, task.frequency_value, date)
  return completions.filter(
    (c) => c.task_id === task.id && c.period_key === periodKey
  ).length
}

export function formatFrequency(task: Task): string {
  switch (task.frequency_type) {
    case 'daily':
      return 'Daily'
    case 'weekly':
      return 'Weekly'
    case 'x_per_week':
      return `${task.frequency_value}x / week`
    case 'biweekly':
      return 'Every 2 weeks'
    case 'monthly':
      return 'Monthly'
    case 'x_per_month':
      return `${task.frequency_value}x / month`
    case 'custom_days':
      return `Every ${task.frequency_value} days`
  }
}

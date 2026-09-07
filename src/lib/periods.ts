import {
  getISOWeek,
  getISOWeekYear,
  format,
  isWeekend,
  isSameDay,
  parseISO,
  differenceInCalendarDays,
} from 'date-fns'
import type { Task, Completion, FrequencyType } from './types'

export function getPeriodKey(frequencyType: FrequencyType, date: Date): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date)

  switch (frequencyType) {
    // Every-N-days tasks are scheduled from their last completion rather than
    // by period (see isTaskAvailable), so like daily and weekdays tasks each
    // completion is keyed to its own day
    case 'daily':
    case 'weekdays':
    case 'custom_days':
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

/** When `task` was most recently completed, or null if it never has been. */
export function getLatestCompletionDate(task: Task, completions: Completion[]): Date | null {
  let latest: Date | null = null
  for (const c of completions) {
    if (c.task_id !== task.id) continue
    const when = parseISO(c.completed_at)
    if (latest === null || when > latest) latest = when
  }
  return latest
}

export function isTaskAvailable(task: Task, completions: Completion[], date: Date = new Date()): boolean {
  if (!task.is_active) return false

  // Weekday tasks only apply Monday–Friday
  if (task.frequency_type === 'weekdays' && isWeekend(date)) return false

  // Every-N-days tasks come back N days after they were last done
  if (task.frequency_type === 'custom_days') {
    const last = getLatestCompletionDate(task, completions)
    return last === null || differenceInCalendarDays(date, last) >= task.frequency_value
  }

  const periodKey = getPeriodKey(task.frequency_type, date)
  const completionsInPeriod = completions.filter(
    (c) => c.task_id === task.id && c.period_key === periodKey
  )

  // Period quota already met — fully done for this period
  if (completionsInPeriod.length >= getRequiredCount(task)) return false

  // For multi-per-period tasks (x_per_week, x_per_month), hide until tomorrow
  // if already completed today — you wouldn't do the same habit twice in one day
  if (task.frequency_type === 'x_per_week' || task.frequency_type === 'x_per_month') {
    const completedToday = completions.some(
      (c) => c.task_id === task.id && isSameDay(parseISO(c.completed_at), date)
    )
    if (completedToday) return false
  }

  return true
}

export function getCompletionCount(task: Task, completions: Completion[], date: Date = new Date()): number {
  const periodKey = getPeriodKey(task.frequency_type, date)
  return completions.filter(
    (c) => c.task_id === task.id && c.period_key === periodKey
  ).length
}

export function formatFrequency(task: Task): string {
  switch (task.frequency_type) {
    case 'daily':
      return 'Daily'
    case 'weekdays':
      return 'Weekdays'
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

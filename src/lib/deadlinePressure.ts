import {
  getISOWeek,
  endOfWeek,
  endOfMonth,
  differenceInCalendarDays,
  parseISO,
} from 'date-fns'
import { getPeriodKey, getRequiredCount } from './periods'
import type { Task, Completion } from './types'

function getDaysLeftInPeriod(task: Task, now: Date): number {
  switch (task.frequency_type) {
    case 'daily':
      return 1

    case 'weekly':
    case 'x_per_week': {
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      return differenceInCalendarDays(weekEnd, now) + 1
    }

    case 'biweekly': {
      const week = getISOWeek(now)
      const isSecondWeekOfBlock = (week - 1) % 2 === 1
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      const daysLeftThisWeek = differenceInCalendarDays(weekEnd, now) + 1
      return isSecondWeekOfBlock ? daysLeftThisWeek : daysLeftThisWeek + 7
    }

    case 'monthly':
    case 'x_per_month': {
      const monthEnd = endOfMonth(now)
      return differenceInCalendarDays(monthEnd, now) + 1
    }

    case 'custom_days':
      // Handled separately in getUrgencyScore
      return task.frequency_value
  }
}

function getCompletionsInPeriod(task: Task, completions: Completion[], now: Date): number {
  const periodKey = getPeriodKey(task.frequency_type, task.frequency_value, now)
  return completions.filter(
    (c) => c.task_id === task.id && c.period_key === periodKey
  ).length
}

/**
 * Returns a numeric urgency score: remaining_completions / remaining_days.
 * Higher = more urgent. A score >= 1.0 means "must do today or already overdue".
 */
export function getUrgencyScore(
  task: Task,
  completions: Completion[],
  now: Date = new Date()
): number {
  // For custom_days, compute days left from last completion
  if (task.frequency_type === 'custom_days') {
    const taskCompletions = completions
      .filter((c) => c.task_id === task.id)
      .map((c) => parseISO(c.completed_at))
      .sort((a, b) => b.getTime() - a.getTime())

    const anchor = taskCompletions.length > 0
      ? taskCompletions[0]
      : parseISO(task.created_at)

    const daysSince = differenceInCalendarDays(now, anchor)
    const daysLeft = Math.max(task.frequency_value - daysSince, 0)

    if (daysLeft === 0) return Infinity
    return 1 / daysLeft
  }

  const required = getRequiredCount(task)
  const completed = getCompletionsInPeriod(task, completions, now)
  const remaining = required - completed

  if (remaining <= 0) return 0

  const daysLeft = getDaysLeftInPeriod(task, now)

  if (daysLeft <= 0) return Infinity
  return remaining / daysLeft
}

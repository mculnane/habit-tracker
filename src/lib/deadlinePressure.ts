import {
  getISOWeek,
  endOfWeek,
  endOfMonth,
  differenceInCalendarDays,
  parseISO,
} from 'date-fns'
import { getPeriodKey, getRequiredCount, getLatestCompletionDate } from './periods'
import type { Task, Completion } from './types'

function getDaysLeftInPeriod(task: Task, now: Date): number {
  switch (task.frequency_type) {
    case 'daily':
    case 'weekdays':
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
      // Not period-based; handled separately in getUrgencyScore
      return 1
  }
}

function getCompletionsInPeriod(task: Task, completions: Completion[], now: Date): number {
  const periodKey = getPeriodKey(task.frequency_type, now)
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
  // Every-N-days tasks are due N days after the last completion (or creation).
  // Due today scores 1, like a daily task, and each overdue day adds 1. Before
  // the due day the score ramps up as for other tasks: 1 / days until due,
  // counting today.
  if (task.frequency_type === 'custom_days') {
    const anchor = getLatestCompletionDate(task, completions) ?? parseISO(task.created_at)
    const daysUntilDue = task.frequency_value - differenceInCalendarDays(now, anchor)
    if (daysUntilDue <= 0) return 1 - daysUntilDue
    return 1 / (daysUntilDue + 1)
  }

  const required = getRequiredCount(task)
  const completed = getCompletionsInPeriod(task, completions, now)
  const remaining = required - completed

  if (remaining <= 0) return 0

  const daysLeft = getDaysLeftInPeriod(task, now)

  if (daysLeft <= 0) return Infinity
  return remaining / daysLeft
}

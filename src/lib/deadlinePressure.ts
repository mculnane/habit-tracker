import {
  getISOWeek,
  endOfWeek,
  endOfMonth,
  differenceInCalendarDays,
  parseISO,
} from 'date-fns'
import { getPeriodKey, getRequiredCount } from './periods'
import type { Task, Completion } from './types'

export type PressureLevel = 'none' | 'low' | 'medium' | 'high'

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
      return task.frequency_value
  }
}

function getCompletionsInPeriod(task: Task, completions: Completion[], now: Date): number {
  const periodKey = getPeriodKey(task.frequency_type, task.frequency_value, now)
  return completions.filter(
    (c) => c.task_id === task.id && c.period_key === periodKey
  ).length
}

export function getDeadlinePressure(
  task: Task,
  completions: Completion[],
  now: Date = new Date()
): PressureLevel {
  // Daily tasks are always due today — skip to avoid visual noise
  if (task.frequency_type === 'daily') return 'none'

  // For custom_days, use days since last completion
  if (task.frequency_type === 'custom_days') {
    const taskCompletions = completions
      .filter((c) => c.task_id === task.id)
      .map((c) => parseISO(c.completed_at))
      .sort((a, b) => b.getTime() - a.getTime())

    const anchor = taskCompletions.length > 0
      ? taskCompletions[0]
      : parseISO(task.created_at)

    const daysSince = differenceInCalendarDays(now, anchor)
    const daysLeft = task.frequency_value - daysSince

    if (daysLeft <= 1) return 'high'
    if (daysLeft <= 2) return 'medium'
    return 'low'
  }

  const required = getRequiredCount(task)
  const completed = getCompletionsInPeriod(task, completions, now)
  const remaining = required - completed

  if (remaining <= 0) return 'none'

  const daysLeft = getDaysLeftInPeriod(task, now)

  if (daysLeft <= remaining) return 'high'
  if (daysLeft <= remaining * 2) return 'medium'
  return 'low'
}

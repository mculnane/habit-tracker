import { useMemo } from 'react'
import { getISOWeek, getISOWeekYear } from 'date-fns'
import { getPeriodKey, getRequiredCount } from '../lib/periods'
import type { Task, Completion } from '../lib/types'

interface Stats {
  weeklyTotal: number
  weeklyCompleted: number
  weeklyPercent: number
  monthlyTotal: number
  monthlyCompleted: number
  monthlyPercent: number
}

export function useStats(tasks: Task[], completions: Completion[]): Stats {
  return useMemo(() => {
    const now = new Date()
    const activeTasks = tasks.filter((t) => t.is_active)

    // Weekly: tasks that have a weekly-or-more-frequent cadence
    const weeklyTypes = new Set(['daily', 'weekly', 'x_per_week'])
    const weeklyTasks = activeTasks.filter((t) => weeklyTypes.has(t.frequency_type))

    let weeklyTotal = 0
    let weeklyCompleted = 0

    for (const task of weeklyTasks) {
      const required = task.frequency_type === 'daily' ? 7 : getRequiredCount(task)
      const periodKey = getPeriodKey(task.frequency_type, task.frequency_value, now)

      // For daily tasks, count all days this week
      if (task.frequency_type === 'daily') {
        const year = getISOWeekYear(now)
        const week = getISOWeek(now)
        const dailyCompletions = completions.filter((c) => {
          if (c.task_id !== task.id) return false
          // period_key for daily is YYYY-MM-DD
          const d = new Date(c.period_key)
          return getISOWeek(d) === week && getISOWeekYear(d) === year
        })
        weeklyTotal += required
        weeklyCompleted += Math.min(dailyCompletions.length, required)
      } else {
        weeklyTotal += required
        const count = completions.filter(
          (c) => c.task_id === task.id && c.period_key === periodKey
        ).length
        weeklyCompleted += Math.min(count, required)
      }
    }

    // Monthly: all active tasks
    let monthlyTotal = 0
    let monthlyCompleted = 0

    for (const task of activeTasks) {
      let required: number
      switch (task.frequency_type) {
        case 'daily':
          required = 30 // approximate
          break
        case 'weekly':
        case 'x_per_week':
          required = (task.frequency_type === 'x_per_week' ? task.frequency_value : 1) * 4
          break
        case 'biweekly':
          required = 2
          break
        case 'monthly':
          required = 1
          break
        case 'x_per_month':
          required = task.frequency_value
          break
        case 'custom_days':
          required = Math.ceil(30 / task.frequency_value)
          break
        default:
          required = 1
      }

      const monthKey = getPeriodKey('monthly', 1, now)
      // Count completions this month across all period keys
      const monthCompletions = completions.filter((c) => {
        if (c.task_id !== task.id) return false
        // Check if the completion falls in current month
        return c.completed_at.startsWith(monthKey)
      }).length

      monthlyTotal += required
      monthlyCompleted += Math.min(monthCompletions, required)
    }

    return {
      weeklyTotal,
      weeklyCompleted,
      weeklyPercent: weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0,
      monthlyTotal,
      monthlyCompleted,
      monthlyPercent: monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0,
    }
  }, [tasks, completions])
}

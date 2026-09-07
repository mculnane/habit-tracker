import { getPeriodKey } from './periods'
import type { Task, Completion } from './types'

let seq = 0

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${++seq}`,
    user_id: 'user-1',
    name: 'Test task',
    frequency_type: 'daily',
    frequency_value: 1,
    sort_order: 0,
    is_active: true,
    created_at: '2026-01-01T00:00:00+00:00',
    ...overrides,
  }
}

/**
 * A completion of `task` at the given instant (ISO string with offset, as
 * Postgres returns it), keyed to that instant's local period unless overridden.
 */
export function makeCompletion(task: Task, completedAt: string, periodKey?: string): Completion {
  return {
    id: `completion-${++seq}`,
    user_id: task.user_id,
    task_id: task.id,
    completed_at: completedAt,
    period_key:
      periodKey ?? getPeriodKey(task.frequency_type, new Date(completedAt)),
  }
}

/** Local-time date: at(2026, 9, 7) is 7 Sep 2026 at noon. Month is 1-based. */
export function at(year: number, month: number, day: number, hour = 12): Date {
  return new Date(year, month - 1, day, hour)
}

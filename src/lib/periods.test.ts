import { describe, it, expect } from 'vitest'
import {
  getPeriodKey,
  getRequiredCount,
  isTaskAvailable,
  getCompletionCount,
  formatFrequency,
} from './periods'
import { makeTask, makeCompletion, at } from './testFixtures'
import type { Task } from './types'

// 7 Sep 2026 is a Monday in ISO week 37. Tests run with TZ=Europe/London (see package.json).
const MON = at(2026, 9, 7)

describe('getPeriodKey', () => {
  it('uses the calendar day for daily and weekdays tasks', () => {
    expect(getPeriodKey('daily', 1, MON)).toBe('2026-09-07')
    expect(getPeriodKey('weekdays', 1, MON)).toBe('2026-09-07')
  })

  it('uses the ISO week for weekly and x_per_week tasks', () => {
    expect(getPeriodKey('weekly', 1, MON)).toBe('2026-W37')
    expect(getPeriodKey('x_per_week', 3, at(2026, 9, 13))).toBe('2026-W37') // Sunday, same week
    expect(getPeriodKey('weekly', 1, at(2026, 9, 6))).toBe('2026-W36')
  })

  it('keeps the ISO week-year across the new year', () => {
    // 2026 has 53 ISO weeks; Sunday 3 Jan 2027 is still in 2026-W53
    expect(getPeriodKey('weekly', 1, at(2027, 1, 3))).toBe('2026-W53')
    expect(getPeriodKey('weekly', 1, at(2027, 1, 4))).toBe('2027-W01')
  })

  it('groups pairs of ISO weeks for biweekly tasks', () => {
    expect(getPeriodKey('biweekly', 1, at(2026, 9, 6))).toBe('2026-BW17') // W36
    expect(getPeriodKey('biweekly', 1, MON)).toBe('2026-BW18') // W37
    expect(getPeriodKey('biweekly', 1, at(2026, 9, 14))).toBe('2026-BW18') // W38
    expect(getPeriodKey('biweekly', 1, at(2026, 9, 21))).toBe('2026-BW19') // W39
  })

  it('uses the calendar month for monthly and x_per_month tasks', () => {
    expect(getPeriodKey('monthly', 1, MON)).toBe('2026-09')
    expect(getPeriodKey('x_per_month', 4, MON)).toBe('2026-09')
  })
})

describe('getRequiredCount', () => {
  it('is the frequency value for x-per-period tasks and 1 otherwise', () => {
    expect(getRequiredCount(makeTask({ frequency_type: 'x_per_week', frequency_value: 3 }))).toBe(3)
    expect(getRequiredCount(makeTask({ frequency_type: 'x_per_month', frequency_value: 5 }))).toBe(5)
    for (const type of ['daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom_days'] as const) {
      expect(getRequiredCount(makeTask({ frequency_type: type, frequency_value: 4 }))).toBe(1)
    }
  })
})

describe('isTaskAvailable', () => {
  it('never shows paused tasks', () => {
    expect(isTaskAvailable(makeTask({ is_active: false }), [], MON)).toBe(false)
  })

  it('shows daily tasks until completed that day', () => {
    const task = makeTask({ frequency_type: 'daily' })
    expect(isTaskAvailable(task, [], MON)).toBe(true)
    const doneToday = makeCompletion(task, '2026-09-07T08:00:00+00:00')
    expect(isTaskAvailable(task, [doneToday], MON)).toBe(false)
    expect(isTaskAvailable(task, [doneToday], at(2026, 9, 8))).toBe(true)
  })

  it('shows weekdays tasks Monday to Friday only', () => {
    const task = makeTask({ frequency_type: 'weekdays' })
    expect(isTaskAvailable(task, [], at(2026, 9, 5))).toBe(false) // Saturday
    expect(isTaskAvailable(task, [], at(2026, 9, 6))).toBe(false) // Sunday
    expect(isTaskAvailable(task, [], MON)).toBe(true)
    expect(isTaskAvailable(task, [], at(2026, 9, 11))).toBe(true) // Friday
    const doneMonday = makeCompletion(task, '2026-09-07T08:00:00+00:00')
    expect(isTaskAvailable(task, [doneMonday], MON)).toBe(false)
    expect(isTaskAvailable(task, [doneMonday], at(2026, 9, 8))).toBe(true)
  })

  it('hides weekly tasks for the rest of the ISO week once done', () => {
    const task = makeTask({ frequency_type: 'weekly' })
    const done = makeCompletion(task, '2026-09-07T08:00:00+00:00')
    expect(isTaskAvailable(task, [done], at(2026, 9, 9))).toBe(false) // Wednesday
    expect(isTaskAvailable(task, [done], at(2026, 9, 13))).toBe(false) // Sunday
    expect(isTaskAvailable(task, [done], at(2026, 9, 14))).toBe(true) // next Monday
  })

  it('shows x_per_week tasks until the weekly quota is met', () => {
    const task = makeTask({ frequency_type: 'x_per_week', frequency_value: 3 })
    const done = ['07', '08', '09'].map((d) => makeCompletion(task, `2026-09-${d}T08:00:00+00:00`))
    const thursday = at(2026, 9, 10)
    expect(isTaskAvailable(task, [], thursday)).toBe(true)
    expect(isTaskAvailable(task, done.slice(0, 2), thursday)).toBe(true)
    expect(isTaskAvailable(task, done, thursday)).toBe(false)
  })

  it('hides x-per-period tasks for the rest of the day after a completion', () => {
    const task = makeTask({ frequency_type: 'x_per_week', frequency_value: 3 })
    const doneEarlier = makeCompletion(task, '2026-09-07T07:00:00+00:00')
    expect(isTaskAvailable(task, [doneEarlier], MON)).toBe(false)
    expect(isTaskAvailable(task, [doneEarlier], at(2026, 9, 8))).toBe(true)

    const monthly = makeTask({ frequency_type: 'x_per_month', frequency_value: 4 })
    const doneToday = makeCompletion(monthly, '2026-09-07T07:00:00+00:00')
    expect(isTaskAvailable(monthly, [doneToday], MON)).toBe(false)
    expect(isTaskAvailable(monthly, [doneToday], at(2026, 9, 8))).toBe(true)
  })

  it('compares completion times in local time, not UTC', () => {
    // 23:30Z on 6 Sep is 00:30 BST on 7 Sep, so this counts as done on Monday
    const task = makeTask({ frequency_type: 'x_per_week', frequency_value: 3 })
    const justAfterMidnight = makeCompletion(task, '2026-09-06T23:30:00+00:00')
    expect(isTaskAvailable(task, [justAfterMidnight], MON)).toBe(false)
  })

  it('hides biweekly tasks for both weeks of the block once done', () => {
    const task = makeTask({ frequency_type: 'biweekly' })
    const done = makeCompletion(task, '2026-09-07T08:00:00+00:00') // W37, block BW18
    expect(isTaskAvailable(task, [done], at(2026, 9, 14))).toBe(false) // W38, same block
    expect(isTaskAvailable(task, [done], at(2026, 9, 21))).toBe(true) // W39, next block
  })

  it('hides monthly tasks for the rest of the month once done', () => {
    const task = makeTask({ frequency_type: 'monthly' })
    const done = makeCompletion(task, '2026-09-01T08:00:00+00:00')
    expect(isTaskAvailable(task, [done], MON)).toBe(false)
    expect(isTaskAvailable(task, [done], at(2026, 10, 1))).toBe(true)
  })

  it('ignores completions belonging to other tasks', () => {
    const task = makeTask({ frequency_type: 'daily' })
    const other = makeTask({ frequency_type: 'daily' })
    const othersCompletion = makeCompletion(other, '2026-09-07T08:00:00+00:00')
    expect(isTaskAvailable(task, [othersCompletion], MON)).toBe(true)
  })
})

describe('getCompletionCount', () => {
  it('counts only completions in the current period', () => {
    const task = makeTask({ frequency_type: 'x_per_week', frequency_value: 3 })
    const completions = [
      makeCompletion(task, '2026-09-04T08:00:00+00:00'), // previous week
      makeCompletion(task, '2026-09-07T08:00:00+00:00'),
      makeCompletion(task, '2026-09-08T08:00:00+00:00'),
    ]
    expect(getCompletionCount(task, completions, at(2026, 9, 9))).toBe(2)
  })
})

describe('formatFrequency', () => {
  it('describes every frequency type', () => {
    const label = (type: Task['frequency_type'], value = 1) =>
      formatFrequency(makeTask({ frequency_type: type, frequency_value: value }))
    expect(label('daily')).toBe('Daily')
    expect(label('weekdays')).toBe('Weekdays')
    expect(label('weekly')).toBe('Weekly')
    expect(label('x_per_week', 3)).toBe('3x / week')
    expect(label('biweekly')).toBe('Every 2 weeks')
    expect(label('monthly')).toBe('Monthly')
    expect(label('x_per_month', 5)).toBe('5x / month')
    expect(label('custom_days', 10)).toBe('Every 10 days')
  })
})

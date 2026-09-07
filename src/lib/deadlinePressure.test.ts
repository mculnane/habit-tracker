import { describe, it, expect } from 'vitest'
import { getUrgencyScore } from './deadlinePressure'
import { makeTask, makeCompletion, at } from './testFixtures'

// Monday 7 Sep 2026: ISO week 37, the first week of a biweekly block.
const MON = at(2026, 9, 7)

describe('getUrgencyScore', () => {
  it('scores remaining completions over days left in the period', () => {
    const weekly = makeTask({ frequency_type: 'weekly' })
    expect(getUrgencyScore(weekly, [], MON)).toBeCloseTo(1 / 7)
    expect(getUrgencyScore(weekly, [], at(2026, 9, 13))).toBe(1) // Sunday: must do today

    const threeAWeek = makeTask({ frequency_type: 'x_per_week', frequency_value: 3 })
    expect(getUrgencyScore(threeAWeek, [], MON)).toBeCloseTo(3 / 7)
    const one = makeCompletion(threeAWeek, '2026-09-07T08:00:00+00:00')
    expect(getUrgencyScore(threeAWeek, [one], MON)).toBeCloseTo(2 / 7)
  })

  it('treats daily and weekdays tasks as due today', () => {
    expect(getUrgencyScore(makeTask({ frequency_type: 'daily' }), [], MON)).toBe(1)
    expect(getUrgencyScore(makeTask({ frequency_type: 'weekdays' }), [], MON)).toBe(1)
  })

  it('is zero once the period quota is met', () => {
    const daily = makeTask({ frequency_type: 'daily' })
    const doneToday = makeCompletion(daily, '2026-09-07T08:00:00+00:00')
    expect(getUrgencyScore(daily, [doneToday], MON)).toBe(0)

    const threeAWeek = makeTask({ frequency_type: 'x_per_week', frequency_value: 3 })
    const done = ['07', '08', '09'].map((d) => makeCompletion(threeAWeek, `2026-09-${d}T08:00:00+00:00`))
    expect(getUrgencyScore(threeAWeek, done, at(2026, 9, 10))).toBe(0)
  })

  it('counts both weeks of a biweekly block', () => {
    const task = makeTask({ frequency_type: 'biweekly' })
    expect(getUrgencyScore(task, [], MON)).toBeCloseTo(1 / 14) // first week: 14 days left
    expect(getUrgencyScore(task, [], at(2026, 9, 14))).toBeCloseTo(1 / 7) // second week
  })

  it('uses days left in the calendar month for monthly tasks', () => {
    const monthly = makeTask({ frequency_type: 'monthly' })
    expect(getUrgencyScore(monthly, [], MON)).toBeCloseTo(1 / 24) // 7 Sep: 24 days left including today
    expect(getUrgencyScore(monthly, [], at(2026, 9, 30))).toBe(1)

    const fourAMonth = makeTask({ frequency_type: 'x_per_month', frequency_value: 4 })
    const one = makeCompletion(fourAMonth, '2026-09-02T08:00:00+00:00')
    expect(getUrgencyScore(fourAMonth, [one], MON)).toBeCloseTo(3 / 24)
  })
})

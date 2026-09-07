import { describe, it, expect } from 'vitest'
import { sortByUrgency } from './sortTasks'
import { makeTask } from './testFixtures'
import type { Task } from './types'

describe('sortByUrgency', () => {
  it('puts higher urgency scores first and breaks ties by name', () => {
    const items = [
      { task: makeTask({ name: 'Cook' }), urgencyScore: 0.5 },
      { task: makeTask({ name: 'Bike' }), urgencyScore: 2 },
      { task: makeTask({ name: 'Ache' }), urgencyScore: 0.5 },
      { task: makeTask({ name: 'Dust' }), urgencyScore: Infinity },
    ]
    expect(sortByUrgency(items).map((i) => i.task.name)).toEqual(['Dust', 'Bike', 'Ache', 'Cook'])
  })

  it('falls back to a static frequency order for plain tasks', () => {
    const tasks: Task[] = [
      makeTask({ name: 'monthly', frequency_type: 'monthly' }),
      makeTask({ name: 'four a month', frequency_type: 'x_per_month', frequency_value: 4 }),
      makeTask({ name: 'biweekly', frequency_type: 'biweekly' }),
      makeTask({ name: 'every 5 days', frequency_type: 'custom_days', frequency_value: 5 }),
      makeTask({ name: 'weekly', frequency_type: 'weekly' }),
      makeTask({ name: 'three a week', frequency_type: 'x_per_week', frequency_value: 3 }),
      makeTask({ name: 'seven a week', frequency_type: 'x_per_week', frequency_value: 7 }),
      makeTask({ name: 'weekdays', frequency_type: 'weekdays' }),
      makeTask({ name: 'daily', frequency_type: 'daily' }),
    ]
    expect(sortByUrgency(tasks).map((t) => t.name)).toEqual([
      'daily',
      'weekdays',
      'seven a week',
      'three a week',
      'weekly',
      'every 5 days',
      'biweekly',
      'four a month',
      'monthly',
    ])
  })

  it('sorts same-frequency tasks by name', () => {
    const tasks = [makeTask({ name: 'Zebra' }), makeTask({ name: 'apple' }), makeTask({ name: 'Mango' })]
    expect(sortByUrgency(tasks).map((t) => t.name)).toEqual(['apple', 'Mango', 'Zebra'])
  })

  it('does not mutate its input', () => {
    const tasks = [makeTask({ name: 'b' }), makeTask({ name: 'a' })]
    sortByUrgency(tasks)
    expect(tasks.map((t) => t.name)).toEqual(['b', 'a'])
  })
})

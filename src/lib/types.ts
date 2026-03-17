export type Context = 'work' | 'personal' | 'both'

export type FrequencyType =
  | 'daily'
  | 'weekly'
  | 'x_per_week'
  | 'biweekly'
  | 'monthly'
  | 'x_per_month'
  | 'custom_days'

export interface Task {
  id: string
  name: string
  context: Context
  frequency_type: FrequencyType
  frequency_value: number
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Completion {
  id: string
  task_id: string
  completed_at: string
  period_key: string
}

export type ContextFilter = 'all' | 'work' | 'personal'

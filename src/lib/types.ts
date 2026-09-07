export type FrequencyType =
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'x_per_week'
  | 'biweekly'
  | 'monthly'
  | 'x_per_month'
  | 'custom_days'

export interface Task {
  id: string
  user_id: string
  name: string
  frequency_type: FrequencyType
  frequency_value: number
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Completion {
  id: string
  user_id: string
  task_id: string
  completed_at: string
  period_key: string
}

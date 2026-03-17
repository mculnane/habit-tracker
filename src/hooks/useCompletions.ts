import { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getPeriodKey } from '../lib/periods'
import type { Completion, Task } from '../lib/types'

export function useCompletions(tasks: Task[]) {
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)
  const [undoItem, setUndoItem] = useState<Completion | null>(null)
  const undoTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchCompletions = useCallback(async () => {
    if (tasks.length === 0) {
      setCompletions([])
      setLoading(false)
      return
    }

    // Get all unique current period keys we need to query
    const now = new Date()
    const periodKeys = new Set<string>()
    for (const task of tasks) {
      periodKeys.add(getPeriodKey(task.frequency_type, task.frequency_value, now))
    }

    const { data, error } = await supabase
      .from('completions')
      .select('*')
      .in('period_key', Array.from(periodKeys))

    if (error) {
      console.error('Failed to fetch completions:', error)
    } else {
      setCompletions(data as Completion[])
    }
    setLoading(false)
  }, [tasks])

  useEffect(() => {
    fetchCompletions()
  }, [fetchCompletions])

  const completeTask = useCallback(
    async (task: Task) => {
      const now = new Date()
      const periodKey = getPeriodKey(task.frequency_type, task.frequency_value, now)

      const { data, error } = await supabase
        .from('completions')
        .insert({ task_id: task.id, period_key: periodKey })
        .select()
        .single()

      if (error) {
        console.error('Failed to complete task:', error)
        return
      }

      const completion = data as Completion
      setCompletions((prev) => [...prev, completion])

      // Set up undo
      if (undoTimeout.current) clearTimeout(undoTimeout.current)
      setUndoItem(completion)
      undoTimeout.current = setTimeout(() => setUndoItem(null), 5000)
    },
    []
  )

  const undoComplete = useCallback(async () => {
    if (!undoItem) return

    const { error } = await supabase
      .from('completions')
      .delete()
      .eq('id', undoItem.id)

    if (error) {
      console.error('Failed to undo completion:', error)
      return
    }

    setCompletions((prev) => prev.filter((c) => c.id !== undoItem.id))
    if (undoTimeout.current) clearTimeout(undoTimeout.current)
    setUndoItem(null)
  }, [undoItem])

  return { completions, loading, fetchCompletions, completeTask, undoItem, undoComplete }
}

import { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getPeriodKey } from '../lib/periods'
import type { Completion, Task } from '../lib/types'

function fetchCompletionsFromDb(tasks: Task[]) {
  const now = new Date()
  const periodKeys = new Set(
    tasks.map((task) => getPeriodKey(task.frequency_type, task.frequency_value, now))
  )
  return supabase
    .from('completions')
    .select('*')
    .in('period_key', Array.from(periodKeys))
}

/**
 * Loads the completions relevant to the given tasks and exposes complete/undo.
 *
 * `tasksLoaded` must stay false until the task list has been fetched. Without
 * it an empty list during startup looks like "no tasks", loading flips to
 * false too early, and the app briefly renders with no completions — showing
 * tasks that were already done today.
 */
export function useCompletions(tasks: Task[], tasksLoaded: boolean) {
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)
  const [undoItem, setUndoItem] = useState<Completion | null>(null)
  const undoTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!tasksLoaded) return

    let cancelled = false

    if (tasks.length === 0) {
      // Deferred so the state update happens outside the effect body itself
      Promise.resolve().then(() => {
        if (cancelled) return
        setCompletions([])
        setLoading(false)
      })
      return () => { cancelled = true }
    }

    fetchCompletionsFromDb(tasks).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        console.error('Failed to fetch completions:', error)
      } else {
        setCompletions(data as Completion[])
      }
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [tasks, tasksLoaded])

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

  return { completions, loading, completeTask, undoItem, undoComplete }
}

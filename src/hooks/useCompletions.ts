import { useCallback, useEffect, useState, useRef } from 'react'
import { startOfDay, subDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import { getPeriodKey } from '../lib/periods'
import type { Completion, Task } from '../lib/types'

/**
 * Loads the completions the schedule needs: everything in the current period
 * for period-based tasks, plus recent history for every-N-days tasks, which
 * are scheduled from their last completion rather than by period. The history
 * window is generous so the overdue amount stays exact well past the due day;
 * anything older counts as never done, which still scores as overdue.
 */
async function fetchCompletionsFromDb(tasks: Task[], now: Date) {
  const periodTasks = tasks.filter((t) => t.frequency_type !== 'custom_days')
  const intervalTasks = tasks.filter((t) => t.frequency_type === 'custom_days')

  const periodQuery =
    periodTasks.length > 0
      ? supabase
          .from('completions')
          .select('*')
          .in('period_key', Array.from(new Set(periodTasks.map((t) => getPeriodKey(t.frequency_type, now)))))
      : null

  const longestInterval = Math.max(0, ...intervalTasks.map((t) => t.frequency_value))
  const historyQuery =
    intervalTasks.length > 0
      ? supabase
          .from('completions')
          .select('*')
          .in('task_id', intervalTasks.map((t) => t.id))
          .gte('completed_at', startOfDay(subDays(now, longestInterval * 2 + 1)).toISOString())
      : null

  const byId = new Map<string, Completion>()
  for (const result of await Promise.all([periodQuery, historyQuery])) {
    if (!result) continue
    if (result.error) return { data: null, error: result.error }
    for (const completion of result.data as Completion[]) byId.set(completion.id, completion)
  }
  return { data: Array.from(byId.values()), error: null }
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

    fetchCompletionsFromDb(tasks, new Date()).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        console.error('Failed to fetch completions:', error)
      } else {
        setCompletions(data)
      }
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [tasks, tasksLoaded])

  const completeTask = useCallback(
    async (task: Task) => {
      const periodKey = getPeriodKey(task.frequency_type, new Date())

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

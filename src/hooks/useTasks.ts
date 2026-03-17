import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task } from '../lib/types'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch tasks:', error)
    } else {
      setTasks(data as Task[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = useCallback(
    async (task: Omit<Task, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()

      if (error) {
        console.error('Failed to add task:', error)
        return null
      }
      setTasks((prev) => [...prev, data as Task])
      return data as Task
    },
    []
  )

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Failed to update task:', error)
        return false
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      )
      return true
    },
    []
  )

  const swapTaskOrder = useCallback(
    async (taskAId: string, taskBId: string) => {
      // Optimistic: swap sort_order in local state immediately
      setTasks((prev) => {
        const a = prev.find((t) => t.id === taskAId)
        const b = prev.find((t) => t.id === taskBId)
        if (!a || !b) return prev

        const aOrder = a.sort_order
        const bOrder = b.sort_order

        return prev
          .map((t) => {
            if (t.id === taskAId) return { ...t, sort_order: bOrder }
            if (t.id === taskBId) return { ...t, sort_order: aOrder }
            return t
          })
          .sort((x, y) => x.sort_order - y.sort_order)
      })

      // Persist to Supabase in background
      const tasks_snapshot = tasks
      const a = tasks_snapshot.find((t) => t.id === taskAId)
      const b = tasks_snapshot.find((t) => t.id === taskBId)
      if (a && b) {
        await Promise.all([
          supabase.from('tasks').update({ sort_order: b.sort_order }).eq('id', taskAId),
          supabase.from('tasks').update({ sort_order: a.sort_order }).eq('id', taskBId),
        ])
      }
    },
    [tasks]
  )

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete task:', error)
      return false
    }
    setTasks((prev) => prev.filter((t) => t.id !== id))
    return true
  }, [])

  return { tasks, loading, fetchTasks, addTask, updateTask, swapTaskOrder, deleteTask }
}

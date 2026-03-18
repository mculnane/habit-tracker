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
    async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'sort_order'>) => {
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

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete task:', error)
      return false
    }
    setTasks((prev) => prev.filter((t) => t.id !== id))
    return true
  }, [])

  return { tasks, loading, fetchTasks, addTask, updateTask, deleteTask }
}

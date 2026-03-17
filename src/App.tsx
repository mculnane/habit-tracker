import { Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { DoNow } from './screens/DoNow'
import { Stats } from './screens/Stats'
import { Manage } from './screens/Manage'
import { useTasks } from './hooks/useTasks'
import { useCompletions } from './hooks/useCompletions'

export default function App() {
  const { tasks, loading: tasksLoading, addTask, updateTask, swapTaskOrder, deleteTask } = useTasks()
  const {
    completions,
    loading: completionsLoading,
    completeTask,
    undoItem,
    undoComplete,
  } = useCompletions(tasks)

  const loading = tasksLoading || completionsLoading

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <Routes>
        <Route
          path="/"
          element={
            <DoNow
              tasks={tasks}
              completions={completions}
              onComplete={completeTask}
              undoItem={undoItem}
              onUndo={undoComplete}
            />
          }
        />
        <Route
          path="/stats"
          element={<Stats tasks={tasks} completions={completions} />}
        />
        <Route
          path="/manage"
          element={
            <Manage
              tasks={tasks}
              onAdd={addTask}
              onUpdate={updateTask}
              onSwap={swapTaskOrder}
              onDelete={deleteTask}
            />
          }
        />
      </Routes>
      <BottomNav />
    </div>
  )
}

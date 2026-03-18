import { Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { DoNow } from './screens/DoNow'
import { Stats } from './screens/Stats'
import { Manage } from './screens/Manage'
import { Login } from './screens/Login'
import { useTasks } from './hooks/useTasks'
import { useCompletions } from './hooks/useCompletions'
import { useAuth } from './hooks/useAuth'

function AuthenticatedApp({ signOut }: { signOut: () => void }) {
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask } = useTasks()
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
      <div className="flex items-center justify-end px-4 pt-3">
        <button
          onClick={signOut}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Sign out
        </button>
      </div>
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
              onDelete={deleteTask}
            />
          }
        />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { session, loading: authLoading, signIn, signOut, verifyOtp } = useAuth()

  if (authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
      </div>
    )
  }

  if (!session) {
    return <Login onSignIn={signIn} onVerifyOtp={verifyOtp} />
  }

  return <AuthenticatedApp signOut={signOut} />
}

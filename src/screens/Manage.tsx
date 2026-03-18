import { useState } from 'react'
import { TaskForm } from '../components/TaskForm'
import { formatFrequency } from '../lib/periods'
import { sortByUrgency } from '../lib/sortTasks'
import type { Task, Context, FrequencyType } from '../lib/types'

const contextColors = {
  work: 'bg-blue-500',
  personal: 'bg-emerald-500',
  both: 'bg-violet-500',
}

interface Props {
  tasks: Task[]
  onAdd: (data: {
    name: string
    context: Context
    frequency_type: FrequencyType
    frequency_value: number
    is_active: boolean
  }) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}

export function Manage({ tasks, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const activeTasks = sortByUrgency(tasks.filter((t) => t.is_active))
  const pausedTasks = tasks.filter((t) => !t.is_active)

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Manage</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingTask(null)
              setShowForm(true)
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            + Add
          </button>
        </div>
      </div>

      {(showForm || editingTask) && (
        <div className="rounded-2xl bg-slate-800/80 p-4">
          <TaskForm
            initial={editingTask ?? undefined}
            onSubmit={(data) => {
              if (editingTask) {
                onUpdate(editingTask.id, data)
              } else {
                onAdd({
                  ...data,
                  is_active: true,
                })
              }
              setShowForm(false)
              setEditingTask(null)
            }}
            onCancel={() => {
              setShowForm(false)
              setEditingTask(null)
            }}
          />
        </div>
      )}

      {activeTasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active ({activeTasks.length})
          </h2>
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-2xl bg-slate-800 px-4 py-3"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${contextColors[task.context]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-100">{task.name}</div>
                <div className="text-xs text-slate-400">{formatFrequency(task)}</div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingTask(task)
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  title="Edit"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  onClick={() => onUpdate(task.id, { is_active: false })}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-yellow-400"
                  title="Pause"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                  </svg>
                </button>
                {confirmDelete === task.id ? (
                  <button
                    onClick={() => {
                      onDelete(task.id)
                      setConfirmDelete(null)
                    }}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-900/30"
                    title="Confirm delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(task.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-red-400"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pausedTasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Paused ({pausedTasks.length})
          </h2>
          {pausedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-2xl bg-slate-800/50 px-4 py-3 opacity-60"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${contextColors[task.context]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-300">{task.name}</div>
                <div className="text-xs text-slate-500">{formatFrequency(task)}</div>
              </div>
              <button
                onClick={() => onUpdate(task.id, { is_active: true })}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-emerald-400"
                title="Resume"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-slate-300">No tasks yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Tap "+ Add" to create your first habit or task.
          </p>
        </div>
      )}
    </div>
  )
}

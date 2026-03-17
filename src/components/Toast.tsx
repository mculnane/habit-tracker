interface Props {
  message: string
  onUndo: () => void
}

export function Toast({ message, onUndo }: Props) {
  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm animate-slide-up">
      <div className="flex items-center justify-between rounded-xl bg-slate-700 px-4 py-3 shadow-lg">
        <span className="text-sm text-slate-200">{message}</span>
        <button
          onClick={onUndo}
          className="ml-3 shrink-0 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
        >
          Undo
        </button>
      </div>
    </div>
  )
}

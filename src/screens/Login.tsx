import { useState } from 'react'

interface Props {
  onSignIn: (email: string) => Promise<{ error: Error | null }>
}

export function Login({ onSignIn }: Props) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await onSignIn(email)

    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      setSent(true)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-100">Habit Tracker</h1>

        {sent ? (
          <div className="rounded-xl bg-slate-800/60 p-6">
            <p className="text-lg font-medium text-slate-200">Check your email</p>
            <p className="mt-2 text-sm text-slate-400">
              We sent a magic link to <span className="font-medium text-slate-300">{email}</span>.
              Click the link to sign in.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-slate-400">Sign in with a magic link</p>

            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

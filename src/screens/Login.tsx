import { useState } from 'react'

interface Props {
  onSignIn: (email: string) => Promise<{ error: Error | null }>
  onVerifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>
}

export function Login({ onSignIn, onVerifyOtp }: Props) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await onVerifyOtp(email, code)

    if (error) {
      setError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-100">Habit Tracker</h1>

        {sent ? (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div className="rounded-xl bg-slate-800/60 p-6">
              <p className="text-lg font-medium text-slate-200">Enter your code</p>
              <p className="mt-2 text-sm text-slate-400">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-slate-300">{email}</span>.
              </p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-center text-2xl tracking-widest text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => { setSent(false); setCode(''); setError('') }}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Use a different email
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-slate-400">Sign in with email</p>

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
              {submitting ? 'Sending...' : 'Send sign-in code'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

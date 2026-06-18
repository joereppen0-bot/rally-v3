import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { CloseIcon, MailIcon, CheckIcon } from './Icons'

export default function AuthModal({ onClose }) {
  const { sendCode, verifyCode } = useAuth()
  const [step, setStep] = useState('email') // email | code | done
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [demoCode, setDemoCode] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submitEmail = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    const res = await sendCode(email)
    setBusy(false)
    if (!res.ok) return setError(res.error || 'Could not send the code.')
    if (res.demo) setDemoCode(res.code)
    setStep('code')
  }

  const submitCode = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    const res = await verifyCode(email, code)
    setBusy(false)
    if (!res.ok) return setError(res.error || 'Verification failed.')
    setStep('done')
    setTimeout(onClose, 900)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 animate-fadeIn" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm animate-sheetUp sm:animate-fadeIn bg-ink-800 rounded-t-3xl sm:rounded-3xl p-6 pb-safe shadow-sheet">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white" aria-label="Close">
          <CloseIcon width={18} height={18} />
        </button>

        {step === 'done' ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckIcon width={28} height={28} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-white">You're verified</h2>
            <p className="mt-1 text-sm text-zinc-400">Signed in as {email}</p>
          </div>
        ) : step === 'email' ? (
          <form onSubmit={submitEmail}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rally/15 text-rally">
              <MailIcon width={24} height={24} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Sign in to Rally</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Enter your email and we'll send a 6-digit verification code. Required to RSVP or add events.
            </p>
            <input
              autoFocus required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-4 w-full rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-rally focus:outline-none"
            />
            {error && <p className="mt-2 text-sm text-rally-light">{error}</p>}
            <button type="submit" disabled={busy}
              className="mt-4 w-full rounded-xl bg-rally py-3.5 text-sm font-bold text-white hover:bg-rally-dark disabled:opacity-60">
              {busy ? 'Sending…' : 'Send verification code'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rally/15 text-rally">
              <MailIcon width={24} height={24} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Enter your code</h2>
            <p className="mt-1 text-sm text-zinc-400">
              We sent a 6-digit code to <span className="text-white">{email}</span>.
              {isSupabaseConfigured && ' You can also just click the link in the email.'}
            </p>

            {demoCode && (
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Demo mode (no email server connected): your code is <span className="font-bold tracking-widest">{demoCode}</span>
              </p>
            )}

            <input
              autoFocus required inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="mt-4 w-full rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-zinc-700 focus:border-rally focus:outline-none"
            />
            {error && <p className="mt-2 text-sm text-rally-light">{error}</p>}
            <button type="submit" disabled={busy || code.length < 6}
              className="mt-4 w-full rounded-xl bg-rally py-3.5 text-sm font-bold text-white hover:bg-rally-dark disabled:opacity-60">
              {busy ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setError(null); setCode('') }}
              className="mt-2 w-full text-center text-xs text-zinc-500 hover:text-zinc-300">
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

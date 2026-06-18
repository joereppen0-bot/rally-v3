import { useState } from 'react'
import { CATEGORIES } from '../lib/categories'
import { isSupabaseConfigured } from '../lib/supabase'
import { geocodeAddress } from '../lib/geo'
import { verifyEvent } from '../lib/ai'
import { useAuth } from '../context/AuthContext'
import { SparkIcon, CheckIcon } from './Icons'

const CATS = CATEGORIES.filter((c) => c.key !== 'all')

export default function SubmitView({ onRequireAuth, onCreate }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '', cause_category: 'rights', date: '', address: '',
    description: '', organiser_name: '', organiser_email: user?.email || '',
  })
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('') // '' | 'verifying'
  const [error, setError] = useState(null)
  const [confirm, setConfirm] = useState(null) // { evt, reason, sources }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const finalize = async (evt, verified) => {
    setBusy(true)
    const res = await onCreate({ ...evt, verified }, user)
    setBusy(false)
    if (!res?.ok && res?.error) { setError(res.error); return }
    setForm((f) => ({ ...f, name: '', date: '', address: '', description: '' }))
    setConfirm(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (isSupabaseConfigured && !user) return onRequireAuth()
    setError(null); setConfirm(null); setBusy(true)
    try {
      const g = await geocodeAddress(form.address)
      const evt = {
        name: form.name,
        cause_category: form.cause_category,
        description: form.description,
        date: new Date(form.date).toISOString(),
        address: g.place_name,
        lat: g.lat,
        lng: g.lng,
        organiser_name: form.organiser_name.trim() || 'Community organiser',
        organiser_email: form.organiser_email.trim(),
      }

      // AI checks the web to confirm the protest is real before it goes live.
      setStage('verifying')
      const v = await verifyEvent(evt)
      setStage('')

      // At launch (Supabase connected) require an explicit confirm for anything the AI
      // didn't positively verify; in demo mode only block clear 'unverified' results.
      const needsConfirm = v.verdict === 'unverified' || (isSupabaseConfigured && v.verdict !== 'verified')
      if (needsConfirm) {
        setBusy(false)
        setConfirm({ evt, reason: v.reason, sources: v.sources || [] })
        return
      }
      await finalize(evt, v.verdict === 'verified')
    } catch (err) {
      setStage('')
      setBusy(false)
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-ink-900 pt-16 pb-24">
      <form onSubmit={submit} className="px-5 space-y-4">
        <h1 className="text-2xl font-bold text-white">Add an event</h1>
        <p className="-mt-2 text-sm text-zinc-400">
          Organising a peaceful protest? Enter an address and we'll place the pin — after a quick AI web check that it's real.
        </p>

        <Field label="Event name">
          <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="March for Housing Justice" />
        </Field>
        <Field label="Cause category">
          <select value={form.cause_category} onChange={set('cause_category')} className={inputCls}>
            {CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Date & time">
          <input required type="datetime-local" value={form.date} onChange={set('date')} className={inputCls} />
        </Field>
        <Field label="Address" hint="We map this for you">
          <input required value={form.address} onChange={set('address')} className={inputCls} placeholder="Foley Square, New York, NY" />
        </Field>
        <Field label="Description">
          <textarea required rows={4} value={form.description} onChange={set('description')} className={inputCls} placeholder="What is this event about?" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Organiser name" hint="optional">
            <input value={form.organiser_name} onChange={set('organiser_name')} className={inputCls} placeholder="Jane Doe" />
          </Field>
          <Field label="Organiser email" hint="optional">
            <input type="email" value={form.organiser_email} onChange={set('organiser_email')} className={inputCls} placeholder="you@org.org" />
          </Field>
        </div>

        {error && <p className="text-sm text-rally-light">{error}</p>}

        {/* AI verification warning / confirm */}
        {confirm && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <SparkIcon width={16} height={16} /> We couldn't confirm this event online
            </div>
            <p className="mt-2 text-sm text-amber-100/80">{confirm.reason}</p>
            {confirm.sources?.length > 0 && (
              <p className="mt-2 text-xs text-amber-200/60">Checked: {confirm.sources.slice(0, 3).join(', ')}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => finalize(confirm.evt, false)} disabled={busy}
                className="flex-1 rounded-lg bg-amber-500/20 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/30">
                Add anyway (unverified)
              </button>
              <button type="button" onClick={() => setConfirm(null)}
                className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-zinc-300">
                Cancel
              </button>
            </div>
          </div>
        )}

        <button type="submit" disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rally py-3.5 text-sm font-bold text-white hover:bg-rally-dark disabled:opacity-60">
          {stage === 'verifying' ? (<><SparkIcon width={16} height={16} className="animate-pulse" /> Checking the web…</>)
            : busy ? 'Placing on map…' : 'Verify & add to map'}
        </button>

        <p className="text-center text-xs text-zinc-600">
          {isSupabaseConfigured
            ? 'Verified events go live; submissions auto-publish within 10 minutes.'
            : 'Connect Supabase to enable live AI web verification.'}
        </p>
      </form>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-rally focus:outline-none'

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-400">
      {label}{hint && <span className="text-zinc-600">{hint}</span>}
    </span>
    {children}
  </label>
)

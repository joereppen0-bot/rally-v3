import { useEffect, useState } from 'react'
import { CATEGORIES } from '../lib/categories'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { geocodeAddress } from '../lib/geo'
import { screenEvent, startCheckout } from '../lib/ai'
import { useAuth } from '../context/AuthContext'
import { SparkIcon, CheckIcon, LocateIcon } from './Icons'

const CATS = CATEGORIES.filter((c) => c.key !== 'all')
const MAX_TRIES = 3
const PRICE = 0.99

export default function SubmitView({ onRequireAuth, onCreate, promoteDemo, onShowEvent }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '', cause_category: 'rights', date: '', address: '',
    description: '', organiser_name: '', organiser_email: user?.email || '',
  })
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState(null)
  const [screenFail, setScreenFail] = useState(null) // { reason, triesLeft }
  const [locked, setLocked] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Load lock state.
  useEffect(() => {
    if (isSupabaseConfigured && user) {
      supabase.from('promo_gate').select('locked').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => setLocked(Boolean(data?.locked)))
    } else if (!isSupabaseConfigured) {
      setLocked(Number(localStorage.getItem('rally.promoFails') || 0) >= MAX_TRIES)
    }
  }, [user])

  const recordFail = async () => {
    if (isSupabaseConfigured && user) {
      const { data } = await supabase.rpc('promo_register_fail')
      const row = Array.isArray(data) ? data[0] : data
      const isLocked = Boolean(row?.locked)
      setLocked(isLocked)
      return { locked: isLocked, triesLeft: Math.max(0, MAX_TRIES - (row?.fail_count || MAX_TRIES)) }
    }
    const n = Number(localStorage.getItem('rally.promoFails') || 0) + 1
    localStorage.setItem('rally.promoFails', String(n))
    const isLocked = n >= MAX_TRIES
    setLocked(isLocked)
    return { locked: isLocked, triesLeft: Math.max(0, MAX_TRIES - n) }
  }

  const buildEvent = async () => {
    const g = await geocodeAddress(form.address)
    return {
      name: form.name, cause_category: form.cause_category, description: form.description,
      date: new Date(form.date).toISOString(), address: g.place_name, lat: g.lat, lng: g.lng,
      organiser_name: form.organiser_name.trim() || 'Community organiser',
      organiser_email: form.organiser_email.trim(),
    }
  }
  const resetForm = () => setForm((f) => ({ ...f, name: '', date: '', address: '', description: '' }))

  // Free: save privately to the author's account.
  const saveFree = async (e) => {
    e.preventDefault()
    if (isSupabaseConfigured && !user) return onRequireAuth()
    setError(null); setScreenFail(null); setBusy(true)
    try {
      const evt = await buildEvent()
      const res = await onCreate(evt, user)
      if (!res?.ok) throw new Error(res?.error || 'Could not save.')
      resetForm()
      onShowEvent(res.event, { private: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  // Paid: screen, then (if it passes) charge and publish to everyone + pin to top.
  const promote = async () => {
    if (isSupabaseConfigured && !user) return onRequireAuth()
    if (locked) { setError('The promote feature is locked for your account after 3 failed checks.'); return }
    setError(null); setScreenFail(null); setBusy(true)
    try {
      const evt = await buildEvent()
      setStage('screening')
      const s = await screenEvent(evt)
      setStage('')
      const passed = s._demo ? true : (s.appropriate === true && s.verdict === 'verified')
      if (!passed) {
        const g = await recordFail()
        setScreenFail({
          reason: s.reason || (s.appropriate === false ? 'Content was flagged as inappropriate.' : 'Could not confirm this protest is real.'),
          triesLeft: g.triesLeft, locked: g.locked,
        })
        return
      }
      // Passed → create the (private) event, then take payment.
      const res = await onCreate(evt, user)
      if (!res?.ok) throw new Error(res?.error || 'Could not create event.')

      const out = await startCheckout(res.event.id, PRICE)
      if (out?.url) { window.location.href = out.url; return } // → Stripe Checkout
      // No Stripe configured (demo/preview): simulate the promotion so you can see it pin to top.
      if (out?.error === 'no_stripe_key') {
        promoteDemo?.(res.event.id, PRICE)
        resetForm()
        onShowEvent({ ...res.event, promoted: true, is_public: true }, { demoPromoted: true })
        return
      }
      throw new Error(out?.detail || 'Payment could not be started.')
    } catch (err) { setStage(''); setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-ink-900 pt-16 pb-24">
      <form onSubmit={saveFree} className="px-5 space-y-4">
        <h1 className="text-2xl font-bold text-white">Add an event</h1>
        <p className="-mt-2 text-sm text-zinc-400">
          Save it privately to your account for free. To publish it to everyone and pin it to the top of the list,
          it's screened by AI and then promoted for ${PRICE.toFixed(2)}.
        </p>

        {isSupabaseConfigured && !user && (
          <button type="button" onClick={onRequireAuth}
            className="w-full rounded-xl border border-rally/40 bg-rally/10 px-4 py-3 text-sm text-rally-light">
            Sign in to add or promote an event →
          </button>
        )}

        <Field label="Event name"><input required value={form.name} onChange={set('name')} className={inp} placeholder="March for Housing Justice" /></Field>
        <Field label="Cause category">
          <select value={form.cause_category} onChange={set('cause_category')} className={inp}>
            {CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Date & time"><input required type="datetime-local" value={form.date} onChange={set('date')} className={inp} /></Field>
        <Field label="Address" hint="We map this for you"><input required value={form.address} onChange={set('address')} className={inp} placeholder="Foley Square, New York, NY" /></Field>
        <Field label="Description"><textarea required rows={4} value={form.description} onChange={set('description')} className={inp} placeholder="What is this event about?" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Organiser name" hint="optional"><input value={form.organiser_name} onChange={set('organiser_name')} className={inp} placeholder="Jane Doe" /></Field>
          <Field label="Organiser email" hint="optional"><input type="email" value={form.organiser_email} onChange={set('organiser_email')} className={inp} placeholder="you@org.org" /></Field>
        </div>

        {error && <p className="text-sm text-rally-light">{error}</p>}

        {screenFail && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-amber-300"><SparkIcon width={16} height={16} /> Didn't pass the check</div>
            <p className="mt-1.5 text-amber-100/80">{screenFail.reason}</p>
            <p className="mt-2 text-xs text-amber-200/70">
              {screenFail.locked ? 'You have used all 3 attempts — promoting is now locked for your account.'
                : `${screenFail.triesLeft} ${screenFail.triesLeft === 1 ? 'try' : 'tries'} left before promoting locks.`}
            </p>
          </div>
        )}

        {locked && !screenFail && (
          <p className="rounded-xl border border-ink-600 bg-ink-800 p-3 text-xs text-zinc-400">
            Promoting is locked for your account after 3 failed screenings. You can still save events privately.
          </p>
        )}

        {/* Free save (form submit) */}
        <button type="submit" disabled={busy}
          className="w-full rounded-xl border border-ink-600 bg-ink-800 py-3.5 text-sm font-semibold text-zinc-200 hover:border-rally/50 disabled:opacity-60">
          {busy && stage !== 'screening' ? 'Saving…' : 'Save to my account (free)'}
        </button>

        {/* Paid promote */}
        <button type="button" onClick={promote} disabled={busy || locked}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rally py-3.5 text-sm font-bold text-white hover:bg-rally-dark disabled:opacity-60">
          {stage === 'screening' ? (<><SparkIcon width={16} height={16} className="animate-pulse" /> Checking it's real & appropriate…</>)
            : <>Publish to everyone & pin to top — ${PRICE.toFixed(2)}</>}
        </button>

        <p className="text-center text-xs text-zinc-600">
          {isSupabaseConfigured ? 'Only charged if it passes the AI check. Promoted events appear first for everyone.'
            : 'Demo mode: connect Stripe + Supabase to take real payments. Promote will preview the pin-to-top.'}
        </p>
      </form>
    </div>
  )
}

const inp = 'w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-rally focus:outline-none'
const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-400">{label}{hint && <span className="text-zinc-600">{hint}</span>}</span>
    {children}
  </label>
)

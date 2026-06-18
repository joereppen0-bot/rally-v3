import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SEED_EVENTS } from '../data/seedEvents'

// Promoted first (higher payment ranks higher), then everything else.
const sortFeed = (arr) =>
  [...arr].sort((a, b) => {
    if (!!b.promoted - !!a.promoted) return !!b.promoted - !!a.promoted
    if ((b.promoted_amount || 0) !== (a.promoted_amount || 0)) return (b.promoted_amount || 0) - (a.promoted_amount || 0)
    return new Date(a.date) - new Date(b.date)
  })

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    if (!isSupabaseConfigured) {
      // Demo: seed events are public; keep any locally-added ones already in state.
      setEvents((prev) => {
        const mine = prev.filter((e) => e._local)
        return sortFeed([...mine, ...SEED_EVENTS.map((e) => ({ ...e, is_public: true }))])
      })
      setLoading(false)
      return
    }
    await supabase.rpc('auto_approve_events').catch(() => {})
    // RLS returns public events + the signed-in user's own private ones.
    const { data, error } = await supabase.from('events').select('*')
    if (error) { setError(error.message); setEvents(SEED_EVENTS.map((e) => ({ ...e, is_public: true }))) }
    else setEvents(sortFeed(data?.length ? data : SEED_EVENTS.map((e) => ({ ...e, is_public: true }))))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const rsvp = useCallback(async (eventId) => {
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, attendance_count: e.attendance_count + 1, _rsvped: true } : e))
    if (!isSupabaseConfigured) return { ok: true, demo: true }
    const { data, error } = await supabase.rpc('rsvp_event', { p_event_id: eventId })
    if (error) return { ok: false, error: error.message }
    if (typeof data === 'number') setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, attendance_count: data } : e))
    return { ok: true }
  }, [])

  // Free post: private to the author until paid promotion makes it public.
  const addEvent = useCallback(async (evt, user) => {
    if (!isSupabaseConfigured) {
      const local = { id: `local-${Date.now()}`, attendance_count: 0, status: 'approved', is_public: false, promoted: false, _local: true, _mine: true, ...evt }
      setEvents((prev) => sortFeed([local, ...prev]))
      return { ok: true, event: local }
    }
    const { data, error } = await supabase.from('events')
      .insert({ ...evt, created_by: user?.id, is_public: false, promoted: false, status: 'pending' })
      .select().single()
    if (error) return { ok: false, error: error.message }
    setEvents((prev) => sortFeed([{ ...data, _mine: true }, ...prev]))
    return { ok: true, event: data }
  }, [])

  // Demo-only: simulate a successful promotion so the pin-to-top behaviour can be previewed.
  const promoteDemo = useCallback((eventId, amount = 0.99) => {
    setEvents((prev) => sortFeed(prev.map((e) => e.id === eventId
      ? { ...e, is_public: true, promoted: true, promoted_amount: amount, verified: true } : e)))
  }, [])

  return { events, loading, error, reload: load, rsvp, addEvent, promoteDemo, setEvents }
}

export async function fetchSummary() { return '' } // (summaries handled in lib/ai)

import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SEED_EVENTS } from '../data/seedEvents'

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!isSupabaseConfigured) {
      setEvents(SEED_EVENTS)
      setLoading(false)
      return
    }

    await supabase.rpc('auto_approve_events').catch(() => {})

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('date', { ascending: true })

    if (error) {
      setError(error.message)
      setEvents(SEED_EVENTS)
    } else {
      setEvents(data?.length ? data : SEED_EVENTS)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const rsvp = useCallback(async (eventId) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, attendance_count: e.attendance_count + 1, _rsvped: true } : e
      )
    )
    if (!isSupabaseConfigured) return { ok: true, demo: true }
    const { data, error } = await supabase.rpc('rsvp_event', { p_event_id: eventId })
    if (error) return { ok: false, error: error.message }
    if (typeof data === 'number') {
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, attendance_count: data } : e)))
    }
    return { ok: true }
  }, [])

  // Add a new event/location. Shows on the map immediately; persists if Supabase is configured.
  const addEvent = useCallback(async (evt, user) => {
    const local = {
      id: `local-${Date.now()}`,
      attendance_count: 0,
      status: 'approved',
      verified: false,
      ...evt,
    }
    setEvents((prev) => [local, ...prev])

    if (isSupabaseConfigured && user) {
      // Real submissions land as 'pending' for the 10-min auto-approve flow.
      const { error } = await supabase
        .from('events')
        .insert({ ...evt, created_by: user.id, status: 'pending' })
      if (error) return { ok: false, error: error.message, event: local }
    }
    return { ok: true, event: local }
  }, [])

  return { events, loading, error, reload: load, rsvp, addEvent, setEvents }
}

export async function fetchSummary(event) {
  if (!isSupabaseConfigured) {
    return (
      `${event.organiser_name} is organising "${event.name}". ` +
      `${event.description} ` +
      `The event is described as a peaceful public gathering to raise awareness of the issue.`
    )
  }
  const { data, error } = await supabase.functions.invoke('summarize', { body: { eventId: event.id } })
  if (error) throw new Error(error.message)
  return data.summary
}

// Ask the server (Claude + web search) whether a submitted protest exists.
export async function verifyEvent(evt) {
  if (!isSupabaseConfigured) {
    return {
      verdict: 'uncertain',
      reason:
        'Automatic web verification runs on the server. Connect Supabase + the verify-event function to enable it — this event is added as unverified for now.',
      sources: [],
    }
  }
  const { data, error } = await supabase.functions.invoke('verify-event', { body: { event: evt } })
  if (error) return { verdict: 'uncertain', reason: 'Verification error: ' + error.message, sources: [] }
  return data
}

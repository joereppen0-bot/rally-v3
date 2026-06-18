import { useEffect, useMemo, useState } from 'react'
import { useEvents } from './hooks/useEvents'
import { useLocation } from './hooks/useGeolocation'
import { useAuth } from './context/AuthContext'
import { applyFilters, defaultFilters, activeFilterCount } from './lib/filters'
import { confirmCheckout } from './lib/ai'
import Landing from './components/Landing'
import LocationGate from './components/LocationGate'
import MapView from './components/MapView'
import ListView from './components/ListView'
import SubmitView from './components/SubmitView'
import ProfileView from './components/ProfileView'
import BottomNav from './components/BottomNav'
import FilterBar from './components/FilterBar'
import FilterPanel from './components/FilterPanel'
import EventBottomSheet from './components/EventBottomSheet'
import AuthModal from './components/AuthModal'

export default function App() {
  const [entered, setEntered] = useState(false)
  const [located, setLocated] = useState(false)
  const [tab, setTab] = useState('map')
  const [filters, setFilters] = useState(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [focus, setFocus] = useState(null)
  const [toast, setToast] = useState(null)

  const { events, rsvp, addEvent, promoteDemo, reload } = useEvents()
  const { coords, status, requestGeo, setManual } = useLocation()
  useAuth()

  const filtered = useMemo(() => applyFilters(events, filters, coords), [events, filters, coords])
  const activeCount = activeFilterCount(filters)
  const requireAuth = () => setShowAuth(true)
  const setCategory = (category) => setFilters((f) => ({ ...f, category }))

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

  // Handle return from Stripe Checkout (?confirm=SESSION_ID) — verify & promote.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sess = params.get('confirm')
    const canceled = params.get('canceled')
    if (sess) {
      confirmCheckout(sess).then((r) => {
        if (r?.paid) { flash('Payment received — your protest is live and pinned to the top!'); reload() }
        else flash('Payment not completed.')
        window.history.replaceState({}, '', window.location.pathname)
      })
    } else if (canceled) {
      flash('Payment canceled — your event was not promoted.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [reload])

  const onShowEvent = (e, opts = {}) => {
    setFocus({ lng: e.lng, lat: e.lat }); setTab('map'); setSelected(e)
    if (opts.private) flash('Saved privately — only you can see it. Promote it to publish to everyone.')
    if (opts.demoPromoted) flash('Promoted (preview) — pinned to the top. Connect Stripe to charge for real.')
  }

  if (!entered) return <Landing onEnter={() => setEntered(true)} />
  if (!located) {
    return (
      <LocationGate status={status}
        onUseGeo={async () => { const r = await requestGeo(); if (r?.ok) setLocated(true); return r }}
        onSetAddress={(lat, lng) => { setManual(lat, lng); setLocated(true) }}
        onSkip={() => setLocated(true)} />
    )
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-stretch sm:items-center sm:justify-center">
      <div className="relative w-full sm:max-w-[420px] h-screen sm:h-[860px] sm:max-h-[92vh] overflow-hidden bg-ink-900 sm:rounded-[2.5rem] sm:border sm:border-ink-700 sm:shadow-2xl">

        {tab === 'map' && (<><MapView events={filtered} center={coords} focus={focus} onSelect={setSelected} /><FilterBar active={filters.category} onChange={setCategory} onOpenFilters={() => setShowFilters(true)} activeCount={activeCount} /></>)}
        {tab === 'list' && (<><ListView events={filtered} center={coords} onSelect={setSelected} onLocate={(e) => { setFocus({ lng: e.lng, lat: e.lat }); setTab('map'); setSelected(e) }} /><FilterBar active={filters.category} onChange={setCategory} onOpenFilters={() => setShowFilters(true)} activeCount={activeCount} /></>)}
        {tab === 'submit' && <SubmitView onRequireAuth={requireAuth} onCreate={addEvent} promoteDemo={promoteDemo} onShowEvent={onShowEvent} />}
        {tab === 'profile' && <ProfileView onRequireAuth={requireAuth} onReplayIntro={() => { setEntered(false); setLocated(false) }} />}

        {showFilters && <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} locationKnown={!coords.isDefault} resultCount={filtered.length} />}
        {selected && <EventBottomSheet event={selected} center={coords} onClose={() => setSelected(null)} onRSVP={rsvp} onRequireAuth={requireAuth} onShowOnMap={(e) => { setFocus({ lng: e.lng, lat: e.lat }); setTab('map'); setSelected(null) }} />}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

        {toast && (
          <div className="absolute top-3 inset-x-3 z-50 rounded-xl bg-ink-700 border border-ink-500 px-4 py-3 text-sm text-white shadow-lg animate-fadeIn">
            {toast}
          </div>
        )}

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useEvents } from './hooks/useEvents'
import { useLocation } from './hooks/useGeolocation'
import { useAuth } from './context/AuthContext'
import { applyFilters, defaultFilters, activeFilterCount } from './lib/filters'
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

  const { events, rsvp, addEvent } = useEvents()
  const { coords, status, requestGeo, setManual } = useLocation()
  useAuth()

  const filtered = useMemo(() => applyFilters(events, filters, coords), [events, filters, coords])
  const activeCount = activeFilterCount(filters)
  const locationKnown = !coords.isDefault

  const requireAuth = () => setShowAuth(true)
  const setCategory = (category) => setFilters((f) => ({ ...f, category }))

  const handleCreate = async (evt, user) => {
    const res = await addEvent(evt, user)
    if (res?.event) {
      setFilters(defaultFilters)
      setFocus({ lng: res.event.lng, lat: res.event.lat })
      setTab('map')
      setSelected(res.event)
    }
    return res
  }

  // From the list: fly the map to the pin and open its details.
  const locateFromList = (e) => {
    setFocus({ lng: e.lng, lat: e.lat })
    setTab('map')
    setSelected(e)
  }
  // From the sheet: reveal the pin on the map (close the sheet so it's visible).
  const showOnMap = (e) => {
    setFocus({ lng: e.lng, lat: e.lat })
    setTab('map')
    setSelected(null)
  }

  if (!entered) return <Landing onEnter={() => setEntered(true)} />

  if (!located) {
    return (
      <LocationGate
        status={status}
        onUseGeo={async () => { const r = await requestGeo(); if (r?.ok) setLocated(true); return r }}
        onSetAddress={(lat, lng) => { setManual(lat, lng); setLocated(true) }}
        onSkip={() => setLocated(true)}
      />
    )
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-stretch sm:items-center sm:justify-center">
      <div className="relative w-full sm:max-w-[420px] h-screen sm:h-[860px] sm:max-h-[92vh] overflow-hidden bg-ink-900 sm:rounded-[2.5rem] sm:border sm:border-ink-700 sm:shadow-2xl">

        {tab === 'map' && (
          <>
            <MapView events={filtered} center={coords} focus={focus} onSelect={setSelected} />
            <FilterBar active={filters.category} onChange={setCategory} onOpenFilters={() => setShowFilters(true)} activeCount={activeCount} />
          </>
        )}

        {tab === 'list' && (
          <>
            <ListView events={filtered} center={coords} onSelect={setSelected} onLocate={locateFromList} />
            <FilterBar active={filters.category} onChange={setCategory} onOpenFilters={() => setShowFilters(true)} activeCount={activeCount} />
          </>
        )}

        {tab === 'submit' && <SubmitView onRequireAuth={requireAuth} onCreate={handleCreate} />}

        {tab === 'profile' && <ProfileView onRequireAuth={requireAuth} onReplayIntro={() => { setEntered(false); setLocated(false) }} />}

        {showFilters && (
          <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} locationKnown={locationKnown} resultCount={filtered.length} />
        )}

        {selected && (
          <EventBottomSheet
            event={selected}
            center={coords}
            onClose={() => setSelected(null)}
            onRSVP={rsvp}
            onRequireAuth={requireAuth}
            onShowOnMap={showOnMap}
          />
        )}

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

const KEY = 'rally.settings'

// UK -> US spelling map (the app's base strings are British).
const SPELL = {
  Labour: 'Labor', labour: 'labor', Organiser: 'Organizer', organiser: 'organizer',
  Organised: 'Organized', organised: 'organized', organising: 'organizing',
  Neighbourhood: 'Neighborhood', neighbourhood: 'neighborhood', Defence: 'Defense', defence: 'defense',
  Centre: 'Center', centre: 'center', Colour: 'Color', colour: 'color', favour: 'favor',
  honour: 'honor', metre: 'meter', metres: 'meters', programme: 'program',
  recognise: 'recognize', recognised: 'recognized', mobilisation: 'mobilization',
  Mobilisation: 'Mobilization', litre: 'liter', kilometre: 'kilometer', kilometres: 'kilometers',
}
const SPELL_RE = new RegExp('\\b(' + Object.keys(SPELL).join('|') + ')\\b', 'g')

function detect() {
  const loc = (typeof navigator !== 'undefined' && (navigator.language || 'en-GB')) || 'en-GB'
  const region = (loc.split('-')[1] || '').toUpperCase()
  const imperial = ['US', 'GB', 'MM', 'LR'].includes(region)
  const clock12 = ['US', 'CA', 'AU', 'NZ', 'PH', 'IN'].includes(region)
  const usSpelling = ['US', 'PH', 'LR'].includes(region)
  return {
    units: imperial ? 'imperial' : 'metric',
    clock: clock12 ? '12' : '24',
    spelling: usSpelling ? 'US' : 'UK',
    auto: true,
    region: region || '—',
  }
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [s, setS] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (saved) return saved
    } catch { /* ignore */ }
    return detect()
  })

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
  }, [s])

  const setUnits = useCallback((units) => setS((p) => ({ ...p, units, auto: false })), [])
  const setClock = useCallback((clock) => setS((p) => ({ ...p, clock, auto: false })), [])
  const setSpelling = useCallback((spelling) => setS((p) => ({ ...p, spelling, auto: false })), [])
  const resetAuto = useCallback(() => setS(detect()), [])

  const helpers = useMemo(() => ({
    sp: (text) => (s.spelling === 'US' && text ? String(text).replace(SPELL_RE, (m) => SPELL[m] || m) : text),
    fmtDistance: (mi) => {
      if (mi == null) return ''
      if (s.units === 'imperial') {
        if (mi < 0.1) return 'here'
        return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`
      }
      const km = mi * 1.60934
      if (km < 0.1) return 'here'
      return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`
    },
    fmtDate: (iso) =>
      new Date(iso).toLocaleString(s.clock === '12' ? 'en-US' : 'en-GB', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: s.clock === '12',
      }),
  }), [s])

  return (
    <SettingsContext.Provider value={{ ...s, setUnits, setClock, setSpelling, resetAuto, ...helpers }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)

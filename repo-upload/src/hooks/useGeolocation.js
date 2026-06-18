import { useCallback, useState } from 'react'

// Default centre: middle of the seeded US cities.
const DEFAULT = { lat: 39.5, lng: -98.35, isDefault: true }

// Location is chosen explicitly by the user (current location or typed address).
export function useLocation() {
  const [coords, setCoords] = useState(DEFAULT)
  const [status, setStatus] = useState('idle') // idle | locating | granted | denied | manual

  const requestGeo = useCallback(
    () =>
      new Promise((resolve) => {
        if (!('geolocation' in navigator)) {
          setStatus('denied')
          return resolve({ ok: false })
        }
        setStatus('locating')
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude, isDefault: false }
            setCoords(c)
            setStatus('granted')
            resolve({ ok: true, coords: c })
          },
          () => { setStatus('denied'); resolve({ ok: false }) },
          { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
        )
      }),
    []
  )

  const setManual = useCallback((lat, lng) => {
    setCoords({ lat, lng, isDefault: false })
    setStatus('manual')
  }, [])

  return { coords, status, requestGeo, setManual }
}

// Haversine distance in miles.
export function distanceMiles(a, b) {
  if (!a || !b) return null
  const R = 3958.8
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

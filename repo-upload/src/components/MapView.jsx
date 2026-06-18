import { useEffect, useRef } from 'react'
import { MAP_STYLE } from '../lib/geo'
import { categoryColor } from '../lib/categories'
import { LocateIcon } from './Icons'

const getMapLib = () => (typeof window !== 'undefined' ? window.maplibregl : null)

export default function MapView({ events, center, focus, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const userMarkerRef = useRef(null)
  const eventsRef = useRef(events)
  eventsRef.current = events

  const toGeoJSON = (evts) => ({
    type: 'FeatureCollection',
    features: evts.map((e) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [e.lng, e.lat] },
      properties: { id: e.id, color: categoryColor(e.cause_category), count: e.attendance_count || 0 },
    })),
  })

  // Every protest is always its own dot (no clustering). Radius scales with BOTH zoom
  // (smaller when zoomed out, but never gone) and attendance (bigger crowd = bigger dot).
  const sizeByCount = (a, b, c) => ['interpolate', ['linear'], ['get', 'count'], 0, a, 500, b, 2000, c]
  const RADIUS = [
    'interpolate', ['linear'], ['zoom'],
    2, sizeByCount(2.5, 3.5, 5),
    5, sizeByCount(3.5, 5, 8),
    9, sizeByCount(6, 9, 15),
    13, sizeByCount(8, 13, 22),
    16, sizeByCount(10, 16, 28),
  ]
  const GLOW = [
    'interpolate', ['linear'], ['zoom'],
    2, sizeByCount(5, 7, 10),
    9, sizeByCount(12, 20, 34),
    16, sizeByCount(18, 30, 52),
  ]

  useEffect(() => {
    const maplibregl = getMapLib()
    if (!maplibregl || mapRef.current || !containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [center.lng, center.lat],
      zoom: center.isDefault ? 1.6 : 11,
      attributionControl: { compact: true },
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource('events', { type: 'geojson', data: toGeoJSON(eventsRef.current) })

      map.addLayer({
        id: 'protests-glow', type: 'circle', source: 'events',
        paint: { 'circle-color': ['get', 'color'], 'circle-radius': GLOW, 'circle-opacity': 0.18, 'circle-blur': 1 },
      })
      map.addLayer({
        id: 'protests', type: 'circle', source: 'events',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': RADIUS,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0B0B0F',
        },
      })

      map.on('click', 'protests', (e) => {
        const id = e.features[0].properties.id
        const ev = eventsRef.current.find((x) => String(x.id) === String(id))
        if (ev) onSelect(ev)
      })
      map.on('mouseenter', 'protests', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'protests', () => (map.getCanvas().style.cursor = ''))
    })

    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const src = map && map.getSource && map.getSource('events')
    if (src) src.setData(toGeoJSON(events))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  // Recentre + pulsing "you are here" marker.
  useEffect(() => {
    const map = mapRef.current
    const maplibregl = getMapLib()
    if (!map || center.isDefault || !maplibregl) return
    const place = () => {
      map.easeTo({ center: [center.lng, center.lat], zoom: 11 })
      if (!userMarkerRef.current) {
        const el = document.createElement('div')
        el.className = 'user-loc'
        userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([center.lng, center.lat]).addTo(map)
      } else {
        userMarkerRef.current.setLngLat([center.lng, center.lat])
      }
    }
    if (map.loaded()) place(); else map.once('load', place)
  }, [center])

  useEffect(() => {
    const map = mapRef.current
    if (map && focus) map.flyTo({ center: [focus.lng, focus.lat], zoom: 13, speed: 1.4 })
  }, [focus])

  const recentre = () => {
    const map = mapRef.current
    if (map && !center.isDefault) map.flyTo({ center: [center.lng, center.lat], zoom: 12 })
  }

  if (!getMapLib()) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-ink-900 px-8 text-center">
        <p className="text-sm text-zinc-400">Loading map engine… check your connection and refresh.</p>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      {!center.isDefault && (
        <button onClick={recentre}
          className="absolute right-4 bottom-24 z-10 rounded-full bg-ink-800/95 border border-ink-600 p-3 text-rally shadow-lg active:scale-95"
          aria-label="Recentre on my location">
          <LocateIcon width={20} height={20} />
        </button>
      )}
    </div>
  )
}

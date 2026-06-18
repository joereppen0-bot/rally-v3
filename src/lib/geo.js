// Keyless map config + geocoding — no API tokens required.

// MapLibre raster style using free CARTO dark basemap tiles + OSM data.
export const MAP_STYLE = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0B0B0F' } },
    { id: 'carto', type: 'raster', source: 'carto', paint: { 'raster-opacity': 0.95 } },
  ],
}

// Forward-geocode an address -> { lat, lng, place_name } using OpenStreetMap Nominatim (no key).
export async function geocodeAddress(query) {
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1` +
    `&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  if (!res.ok) throw new Error('Geocoding service unavailable')
  const data = await res.json()
  const f = data?.[0]
  if (!f) throw new Error('Could not find that address — try adding a city and country')
  return { lat: parseFloat(f.lat), lng: parseFloat(f.lon), place_name: f.display_name }
}

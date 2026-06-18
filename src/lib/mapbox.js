export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
export const isMapboxConfigured = Boolean(MAPBOX_TOKEN)

// Forward-geocode an address string -> { lat, lng, place_name } using Mapbox.
export async function geocodeAddress(query) {
  if (!isMapboxConfigured) throw new Error('Mapbox token not configured')
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${MAPBOX_TOKEN}&country=US&limit=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()
  const f = data.features?.[0]
  if (!f) throw new Error('No match for that address')
  return { lng: f.center[0], lat: f.center[1], place_name: f.place_name }
}

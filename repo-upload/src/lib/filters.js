import { distanceMiles } from '../hooks/useGeolocation'

export const TIME_WINDOWS = [
  { key: 'any', label: 'Any time' },
  { key: 'today', label: 'Today' },
  { key: 'weekend', label: 'This weekend' },
  { key: 'week', label: 'Next 7 days' },
  { key: 'month', label: 'Next 30 days' },
]

export const ATTENDANCE_TIERS = [
  { key: 0, label: 'Any size' },
  { key: 100, label: '100+' },
  { key: 500, label: '500+' },
  { key: 1000, label: '1,000+' },
]

export const DISTANCE_TIERS = [
  { key: 0, label: 'Any distance' },
  { key: 5, label: 'Within 5 mi' },
  { key: 25, label: 'Within 25 mi' },
  { key: 100, label: 'Within 100 mi' },
]

export const defaultFilters = { category: 'all', query: '', minAttendance: 0, maxMiles: 0, when: 'any' }

function inWindow(dateIso, when) {
  if (when === 'any') return true
  const d = new Date(dateIso)
  const now = new Date()
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0)

  if (when === 'today') {
    const end = new Date(startToday); end.setDate(end.getDate() + 1)
    return d >= startToday && d < end
  }
  if (when === 'week') {
    const end = new Date(startToday); end.setDate(end.getDate() + 7)
    return d >= now && d < end
  }
  if (when === 'month') {
    const end = new Date(startToday); end.setDate(end.getDate() + 30)
    return d >= now && d < end
  }
  if (when === 'weekend') {
    const day = now.getDay() // 0 Sun .. 6 Sat
    const sat = new Date(startToday); sat.setDate(sat.getDate() + ((6 - day + 7) % 7))
    const end = new Date(sat); end.setDate(sat.getDate() + 2) // Sat 00:00 -> Mon 00:00
    return d >= sat && d < end
  }
  return true
}

export function applyFilters(events, filters, center) {
  const q = filters.query.trim().toLowerCase()
  return events.filter((e) => {
    if (filters.category !== 'all' && e.cause_category !== filters.category) return false
    if (filters.minAttendance && (e.attendance_count || 0) < filters.minAttendance) return false
    if (q) {
      const hay = `${e.name} ${e.description} ${e.organiser_name} ${e.address} ${e.country || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filters.maxMiles && center && !center.isDefault) {
      const dist = distanceMiles(center, { lat: e.lat, lng: e.lng })
      if (dist != null && dist > filters.maxMiles) return false
    }
    if (!inWindow(e.date, filters.when)) return false
    return true
  })
}

export function activeFilterCount(f) {
  let n = 0
  if (f.category !== 'all') n++
  if (f.query.trim()) n++
  if (f.minAttendance) n++
  if (f.maxMiles) n++
  if (f.when !== 'any') n++
  return n
}

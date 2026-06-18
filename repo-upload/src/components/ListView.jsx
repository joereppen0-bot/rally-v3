import { categoryColor, categoryLabel } from '../lib/categories'
import { distanceMiles } from '../hooks/useGeolocation'
import { useSettings } from '../context/SettingsContext'
import { CalendarIcon, UsersIcon, PinIcon, LocateIcon, CheckIcon } from './Icons'

export default function ListView({ events, center, onSelect, onLocate }) {
  const { sp, fmtDate, fmtDistance } = useSettings()
  const withDist = events
    .map((e) => ({ ...e, _dist: distanceMiles(center, { lat: e.lat, lng: e.lng }) }))
    .sort((a, b) => (a._dist ?? Infinity) - (b._dist ?? Infinity))

  return (
    <div className="absolute inset-0 overflow-y-auto bg-ink-900 pt-16 pb-24">
      <div className="px-4">
        <p className="mb-3 text-xs text-zinc-500">{withDist.length} events</p>
        {withDist.length === 0 && <p className="mt-20 text-center text-zinc-500">No events match these filters.</p>}
        <div className="space-y-3">
          {withDist.map((e) => {
            const color = categoryColor(e.cause_category)
            return (
              <div key={e.id} onClick={() => onSelect(e)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 transition-colors hover:border-ink-500">
                <div className="h-1.5 w-full" style={{ background: color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: `${color}22`, color }}>
                        {sp(categoryLabel(e.cause_category))}
                      </span>
                      <span className="text-[11px] text-zinc-500">{e.country}</span>
                      {e.verified && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                          <CheckIcon width={11} height={11} /> Verified
                        </span>
                      )}
                    </div>
                    {e._dist != null && <span className="text-xs text-zinc-500">{fmtDistance(e._dist)}</span>}
                  </div>

                  <h3 className="mt-2 text-base font-bold text-white">{e.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span className="flex items-center gap-1"><CalendarIcon width={13} height={13} />{fmtDate(e.date)}</span>
                    <span className="flex items-center gap-1"><UsersIcon width={13} height={13} />{e.attendance_count.toLocaleString()} going</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                    <PinIcon width={13} height={13} />{e.address}
                  </div>

                  <button onClick={(ev) => { ev.stopPropagation(); onLocate(e) }}
                    className="mt-3 flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-700 px-3 py-1.5 text-xs font-semibold text-rally hover:border-rally/60">
                    <LocateIcon width={14} height={14} /> Locate on map
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

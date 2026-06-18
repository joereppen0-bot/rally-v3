import { useEffect, useState } from 'react'
import { categoryColor, categoryLabel } from '../lib/categories'
import { distanceMiles } from '../hooks/useGeolocation'
import { summarizeEvent } from '../lib/ai'
import { fetchWiki } from '../lib/wiki'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import {
  CloseIcon, CalendarIcon, PinIcon, UsersIcon, UserIcon, ShareIcon, SparkIcon, CheckIcon, LocateIcon,
} from './Icons'

export default function EventBottomSheet({ event, center, onClose, onRSVP, onRequireAuth, onShowOnMap }) {
  const { user } = useAuth()
  const { sp, fmtDate, fmtDistance } = useSettings()
  const [summary, setSummary] = useState(event?.ai_summary || null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(Boolean(event?.ai_summary))
  const [rsvping, setRsvping] = useState(false)
  const [rsvped, setRsvped] = useState(Boolean(event?._rsvped))
  const [wiki, setWiki] = useState(null)
  const [imgOk, setImgOk] = useState(true)

  useEffect(() => {
    setSummary(event?.ai_summary || null)
    setShowSummary(Boolean(event?.ai_summary))
    setRsvped(Boolean(event?._rsvped))
    setWiki(null); setImgOk(true)
    let alive = true
    if (event?.wiki) fetchWiki(event.wiki).then((w) => { if (alive) setWiki(w) })
    return () => { alive = false }
  }, [event?.id])

  if (!event) return null
  const color = categoryColor(event.cause_category)
  const dist = center && !center.isDefault ? distanceMiles(center, { lat: event.lat, lng: event.lng }) : null
  const image = (imgOk && (event.image || wiki?.thumbnail)) || null

  const handleSummary = async () => {
    setShowSummary(true)
    if (summary) return
    setSummaryLoading(true)
    try { setSummary(await summarizeEvent(event)) } finally { setSummaryLoading(false) }
  }
  const handleRSVP = async () => {
    if (!user) return onRequireAuth()
    setRsvping(true)
    const res = await onRSVP(event.id)
    setRsvping(false)
    if (res?.ok) setRsvped(true)
  }
  const handleShare = async () => {
    const data = { title: event.name, text: `${event.name} — ${fmtDate(event.date)} · ${event.address}`, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else { await navigator.clipboard.writeText(`${data.text}\n${data.url}`); alert('Event details copied to clipboard') }
    } catch { /* cancelled */ }
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 animate-fadeIn" onClick={onClose} />
      <div className="relative animate-sheetUp bg-ink-800 rounded-t-3xl shadow-sheet max-h-[92%] overflow-y-auto pb-safe">

        {/* Banner: real photo from Wikipedia, or a cause gradient fallback */}
        <div className="relative h-40 w-full overflow-hidden rounded-t-3xl"
          style={{ background: `linear-gradient(135deg, ${color}cc, ${color}33)` }}>
          {image && (
            <img src={image} alt="" onError={() => setImgOk(false)}
              className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/20 to-transparent" />
          <button onClick={onClose} className="absolute right-3 top-3 p-2 rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60" aria-label="Close">
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="px-5 pb-6 -mt-6 relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${color}22`, color }}>
              {sp(categoryLabel(event.cause_category))}
            </span>
            {event.country && <span className="rounded-full bg-ink-700 px-3 py-1 text-xs text-zinc-300">{event.country}</span>}
            {event.verified && (
              <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                <CheckIcon width={11} height={11} /> Verified
              </span>
            )}
            {dist != null && <span className="text-xs text-zinc-500">{fmtDistance(dist)} away</span>}
          </div>

          <h2 className="mt-3 text-2xl font-bold leading-tight text-white">{event.name}</h2>

          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <Row icon={<CalendarIcon width={18} height={18} />} label="When">{fmtDate(event.date)}</Row>
            <Row icon={<PinIcon width={18} height={18} />} label="Where">{event.address}</Row>
            <Row icon={<UserIcon width={18} height={18} />} label={sp('Led by')}>{sp(event.organiser_name)}</Row>
            <Row icon={<UsersIcon width={18} height={18} />} label="Attendance">
              <span className="font-semibold text-white">{event.attendance_count.toLocaleString()}</span> expected
            </Row>
          </div>

          {event.description && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Advocating for</p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{sp(event.description)}</p>
            </div>
          )}

          {/* Sourced background pulled live from Wikipedia */}
          {wiki?.extract && (
            <div className="mt-4 rounded-xl border border-ink-600 bg-ink-900/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Background</p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{wiki.extract}</p>
            </div>
          )}

          {/* AI neutral summary */}
          <div className="mt-4">
            {!showSummary ? (
              <button onClick={handleSummary}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-600 bg-ink-700 py-3 text-sm font-medium text-zinc-200 hover:border-rally/60">
                <SparkIcon width={18} height={18} className="text-rally" /> What is this about?
              </button>
            ) : (
              <div className="rounded-xl border border-ink-600 bg-ink-900/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rally">
                  <SparkIcon width={14} height={14} /> Neutral summary
                </div>
                {summaryLoading ? <Shimmer /> : <p className="text-sm leading-relaxed text-zinc-200">{summary}</p>}
              </div>
            )}
          </div>

          {/* Source link */}
          {event.source && (
            <a href={event.source} target="_blank" rel="noreferrer"
              className="mt-3 inline-block text-xs text-rally hover:underline">
              Source: {new URL(event.source).hostname.replace('www.', '')} ↗
            </a>
          )}

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <button onClick={handleRSVP} disabled={rsvping || rsvped}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all ${
                rsvped ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rally text-white hover:bg-rally-dark active:scale-[0.99]'
              } disabled:opacity-80`}>
              {rsvped ? <><CheckIcon width={18} height={18} /> Going</> : rsvping ? 'Saving…' : "I'm going"}
            </button>
            <button onClick={handleShare}
              className="flex items-center justify-center rounded-xl border border-ink-600 bg-ink-700 px-4 text-zinc-200 hover:border-ink-500" aria-label="Share">
              <ShareIcon width={20} height={20} />
            </button>
          </div>

          {onShowOnMap && (
            <button onClick={() => onShowOnMap(event)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-600 bg-ink-700 py-3 text-sm font-semibold text-rally hover:border-rally/60">
              <LocateIcon width={18} height={18} /> Show on map
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const Row = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 text-zinc-500">{icon}</span>
    <div className="flex-1">
      <span className="block text-[11px] uppercase tracking-wide text-zinc-600">{label}</span>
      <span>{children}</span>
    </div>
  </div>
)

const Shimmer = () => (
  <div className="space-y-2">{[100, 95, 70].map((w, i) => (
    <div key={i} className="h-3 rounded bg-ink-600 animate-pulse" style={{ width: `${w}%` }} />
  ))}</div>
)

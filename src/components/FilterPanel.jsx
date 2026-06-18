import { CATEGORIES } from '../lib/categories'
import { TIME_WINDOWS, ATTENDANCE_TIERS, DISTANCE_TIERS, defaultFilters } from '../lib/filters'
import { CloseIcon, SearchIcon } from './Icons'
import { useSettings } from '../context/SettingsContext'

export default function FilterPanel({ filters, onChange, onClose, locationKnown, resultCount }) {
  const { sp } = useSettings()
  const set = (patch) => onChange({ ...filters, ...patch })

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 animate-fadeIn" onClick={onClose} />
      <div className="relative animate-sheetUp bg-ink-800 rounded-t-3xl shadow-sheet max-h-[90%] overflow-y-auto pb-safe">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-ink-800/95 backdrop-blur px-5 pt-4 pb-3 rounded-t-3xl border-b border-ink-700">
          <h2 className="text-lg font-bold text-white">Filters</h2>
          <button onClick={() => onChange({ ...defaultFilters })} className="text-sm font-medium text-rally">Reset</button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Keyword */}
          <Group label="What it's about">
            <div className="flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-900 px-3">
              <SearchIcon width={16} height={16} className="text-zinc-500" />
              <input
                value={filters.query}
                onChange={(e) => set({ query: e.target.value })}
                placeholder="Search cause, organiser, place…"
                className="w-full bg-transparent py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
              />
            </div>
          </Group>

          {/* Cause */}
          <Group label="Cause">
            <Chips
              options={CATEGORIES.map((c) => ({ key: c.key, label: sp(c.label) }))}
              value={filters.category}
              onPick={(category) => set({ category })}
            />
          </Group>

          {/* Time */}
          <Group label="When">
            <Chips
              options={TIME_WINDOWS}
              value={filters.when}
              onPick={(when) => set({ when })}
            />
          </Group>

          {/* Attendance */}
          <Group label="Crowd size">
            <Chips
              options={ATTENDANCE_TIERS}
              value={filters.minAttendance}
              onPick={(minAttendance) => set({ minAttendance })}
            />
          </Group>

          {/* Distance */}
          <Group label="Distance from you" hint={locationKnown ? null : 'Enable location to use'}>
            <Chips
              options={DISTANCE_TIERS}
              value={filters.maxMiles}
              onPick={(maxMiles) => set({ maxMiles })}
              disabled={!locationKnown}
            />
          </Group>
        </div>

        <div className="sticky bottom-0 bg-ink-800/95 backdrop-blur px-5 py-4 border-t border-ink-700">
          <button onClick={onClose} className="w-full rounded-xl bg-rally py-3.5 text-sm font-bold text-white hover:bg-rally-dark">
            Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </button>
        </div>

        <button onClick={onClose} className="absolute right-4 top-4 p-1 text-zinc-400 hover:text-white" aria-label="Close">
          <CloseIcon width={18} height={18} />
        </button>
      </div>
    </div>
  )
}

const Group = ({ label, hint, children }) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-semibold text-zinc-200">{label}</span>
      {hint && <span className="text-xs text-zinc-600">{hint}</span>}
    </div>
    {children}
  </div>
)

const Chips = ({ options, value, onPick, disabled }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => {
      const on = value === o.key
      return (
        <button
          key={String(o.key)}
          disabled={disabled}
          onClick={() => onPick(o.key)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:opacity-40 ${
            on
              ? 'bg-rally border-rally text-white'
              : 'bg-ink-900 border-ink-600 text-zinc-300 hover:border-ink-500'
          }`}
        >
          {o.label}
        </button>
      )
    })}
  </div>
)

import { CATEGORIES } from '../lib/categories'
import { useSettings } from '../context/SettingsContext'
import { TuneIcon } from './Icons'

export default function FilterBar({ active, onChange, onOpenFilters, activeCount = 0 }) {
  const { sp } = useSettings()
  return (
    <div className="absolute top-0 inset-x-0 z-20 pt-3 pb-2 bg-gradient-to-b from-ink-900/95 to-transparent">
      <div className="flex items-center gap-2 px-3 overflow-x-auto no-scrollbar">
        <button
          onClick={onOpenFilters}
          className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-ink-600 bg-ink-800/95 px-3.5 py-1.5 text-sm font-medium text-zinc-200 hover:border-ink-500"
        >
          <TuneIcon width={15} height={15} />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rally px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        <span className="h-5 w-px shrink-0 bg-ink-600" />

        {CATEGORIES.map((c) => {
          const on = active === c.key
          return (
            <button
              key={c.key}
              onClick={() => onChange(c.key)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium border transition-all ${
                on
                  ? 'bg-rally border-rally text-white shadow-lg shadow-rally/30'
                  : 'bg-ink-800/90 border-ink-600 text-zinc-300 hover:border-ink-500'
              }`}
            >
              {sp(c.label)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

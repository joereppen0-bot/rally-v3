import { MapIcon, ListIcon, PlusIcon, UserIcon } from './Icons'

const TABS = [
  { key: 'map', label: 'Map', Icon: MapIcon },
  { key: 'list', label: 'List', Icon: ListIcon },
  { key: 'submit', label: 'Submit', Icon: PlusIcon },
  { key: 'profile', label: 'Profile', Icon: UserIcon },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="absolute bottom-0 inset-x-0 z-30 bg-ink-900/95 backdrop-blur border-t border-ink-600 pb-safe">
      <div className="flex">
        {TABS.map(({ key, label, Icon }) => {
          const on = active === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                on ? 'text-rally' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon width={22} height={22} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

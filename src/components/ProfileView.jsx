import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { UserIcon } from './Icons'

export default function ProfileView({ onRequireAuth, onReplayIntro }) {
  const { user, signOut } = useAuth()
  const { units, clock, spelling, auto, region, setUnits, setClock, setSpelling, resetAuto } = useSettings()

  return (
    <div className="absolute inset-0 overflow-y-auto bg-ink-900 pt-16 pb-24">
      <div className="px-5">
        <h1 className="text-2xl font-bold text-white">Profile</h1>

        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-ink-600 bg-ink-800 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rally/15 text-rally">
            <UserIcon width={28} height={28} />
          </div>
          <div className="min-w-0">
            {user ? (<><p className="truncate font-semibold text-white">{user.email}</p><p className="text-sm text-zinc-500">Signed in</p></>)
              : (<><p className="font-semibold text-white">Not signed in</p><p className="text-sm text-zinc-500">Sign in to RSVP and add events</p></>)}
          </div>
        </div>

        {user ? (
          <button onClick={signOut} className="mt-4 w-full rounded-xl border border-ink-600 bg-ink-800 py-3.5 text-sm font-semibold text-zinc-200 hover:border-rally/50">Sign out</button>
        ) : (
          <button onClick={onRequireAuth} className="mt-4 w-full rounded-xl bg-rally py-3.5 text-sm font-bold text-white hover:bg-rally-dark">Sign in with email</button>
        )}

        {/* Settings */}
        <div className="mt-6 rounded-2xl border border-ink-600 bg-ink-800 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Region & units</h2>
            <button onClick={resetAuto} className="text-xs font-medium text-rally">
              {auto ? `Auto (${region})` : 'Reset to auto'}
            </button>
          </div>
          <Seg label="Distance" value={units} onPick={setUnits}
            options={[{ k: 'imperial', l: 'Miles' }, { k: 'metric', l: 'Kilometres' }]} />
          <Seg label="Time" value={clock} onPick={setClock}
            options={[{ k: '12', l: '12-hour' }, { k: '24', l: '24-hour' }]} />
          <Seg label="Spelling" value={spelling} onPick={setSpelling}
            options={[{ k: 'UK', l: 'British' }, { k: 'US', l: 'American' }]} />
          <p className="mt-3 text-xs text-zinc-600">Auto-detected from your device; change anytime.</p>
        </div>

        <button onClick={onReplayIntro} className="mt-4 w-full rounded-xl border border-ink-600 bg-ink-800 py-3.5 text-sm font-semibold text-zinc-200 hover:border-rally/50">
          Watch the intro again
        </button>

        <div className="mt-6 rounded-2xl border border-ink-600 bg-ink-800/60 p-5 text-sm text-zinc-400">
          <p className="font-semibold text-zinc-200">About Rally</p>
          <p className="mt-2 leading-relaxed">
            Rally maps peaceful protests and community action worldwide. Browse the map, read neutral
            summaries, RSVP, and add your own events.
          </p>
        </div>
      </div>
    </div>
  )
}

const Seg = ({ label, value, options, onPick }) => (
  <div className="mt-4">
    <span className="text-xs font-medium text-zinc-400">{label}</span>
    <div className="mt-1.5 flex gap-2">
      {options.map((o) => (
        <button key={o.k} onClick={() => onPick(o.k)}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
            value === o.k ? 'bg-rally border-rally text-white' : 'bg-ink-900 border-ink-600 text-zinc-300 hover:border-ink-500'
          }`}>
          {o.l}
        </button>
      ))}
    </div>
  </div>
)

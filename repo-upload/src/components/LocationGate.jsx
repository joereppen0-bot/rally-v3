import { useState } from 'react'
import { geocodeAddress } from '../lib/geo'
import { LocateIcon, PinIcon } from './Icons'

export default function LocationGate({ onUseGeo, onSetAddress, onSkip, status }) {
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const useGeo = async () => {
    setBusy(true); setError(null)
    const res = await onUseGeo()
    setBusy(false)
    if (!res?.ok) setError("Couldn't get your location — enter your address below instead.")
  }

  const setAddr = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const g = await geocodeAddress(address)
      onSetAddress(g.lat, g.lng)
    } catch (err) {
      setError(err.message || 'Could not find that address.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-stretch sm:items-center sm:justify-center">
      <div className="relative w-full sm:max-w-[420px] h-screen sm:h-[860px] sm:max-h-[92vh] overflow-y-auto bg-ink-900 sm:rounded-[2.5rem] sm:border sm:border-ink-700 flex flex-col justify-center px-7">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rally/15 text-rally">
          <PinIcon width={28} height={28} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">Where are you?</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We'll center the map on you and show how far each protest is. Your location stays on your device.
        </p>

        <button
          onClick={useGeo}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-rally py-3.5 text-sm font-bold text-white hover:bg-rally-dark disabled:opacity-60"
        >
          <LocateIcon width={18} height={18} />
          {status === 'locating' ? 'Locating…' : 'Use my current location'}
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-zinc-600">
          <span className="h-px flex-1 bg-ink-600" /> or <span className="h-px flex-1 bg-ink-600" />
        </div>

        <form onSubmit={setAddr}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address or city"
            className="w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-rally focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !address.trim()}
            className="mt-3 w-full rounded-xl border border-ink-600 bg-ink-800 py-3.5 text-sm font-semibold text-zinc-200 hover:border-rally/50 disabled:opacity-50"
          >
            {busy ? 'Setting…' : 'Set my location'}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-rally-light">{error}</p>}

        <button onClick={onSkip} className="mt-6 text-center text-xs text-zinc-500 hover:text-zinc-300">
          Skip — just browse everything
        </button>
      </div>
    </div>
  )
}

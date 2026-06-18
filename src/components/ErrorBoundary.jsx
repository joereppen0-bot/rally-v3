import { Component } from 'react'

// Catches any render/lifecycle crash so the app shows a readable message
// instead of a blank white screen. Also surfaces the error text to help debug.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Logged to the browser console for debugging.
    console.error('[Rally] Uncaught error:', error, info)
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error)
      return (
        <div className="min-h-screen w-full bg-ink-900 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-2xl border border-ink-700 bg-ink-800 p-6 text-center">
            <h1 className="text-lg font-bold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-zinc-400">
              The app hit an unexpected error. Try reloading — if it keeps happening, this detail helps us fix it:
            </p>
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-ink-900 px-3 py-2 text-left text-xs text-rally-light whitespace-pre-wrap break-words">
              {msg}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload() }}
              className="mt-4 w-full rounded-xl bg-rally py-3 text-sm font-bold text-white hover:bg-rally-dark"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const demo = useRef(null) // { email, code } in demo mode

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Step 1: email a verification code (+ magic link). Returns { ok, demo, code?, error? }.
  const sendCode = useCallback(async (email) => {
    const clean = email.trim().toLowerCase()
    if (!isSupabaseConfigured) {
      const code = String(Math.floor(100000 + Math.random() * 900000))
      demo.current = { email: clean, code }
      return { ok: true, demo: true, code }
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    })
    return { ok: !error, error: error?.message }
  }, [])

  // Step 2: verify the 6-digit code.
  const verifyCode = useCallback(async (email, token) => {
    const clean = email.trim().toLowerCase()
    const code = token.trim()
    if (!isSupabaseConfigured) {
      if (demo.current && demo.current.email === clean && demo.current.code === code) {
        setUser({ email: clean, id: 'demo-user' })
        demo.current = null
        return { ok: true }
      }
      return { ok: false, error: 'That code is not correct. Check and try again.' }
    }
    const { data, error } = await supabase.auth.verifyOtp({ email: clean, token: code, type: 'email' })
    if (error) return { ok: false, error: error.message }
    setUser(data.user ?? null)
    return { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, sendCode, verifyCode, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

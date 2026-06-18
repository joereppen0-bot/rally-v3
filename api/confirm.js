import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { sessionId } = body
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return res.status(200).json({ error: 'no_stripe_key' })
  if (!sessionId) return res.status(400).json({ error: 'sessionId_required' })

  try {
    const stripe = new Stripe(key)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') return res.status(200).json({ paid: false })

    const eventId = session.metadata?.eventId
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    await admin.from('events').update({
      is_public: true,
      promoted: true,
      promoted_amount: (session.amount_total || 0) / 100,
      promoted_at: new Date().toISOString(),
      verified: true,
      status: 'approved',
    }).eq('id', eventId)

    res.status(200).json({ paid: true, eventId })
  } catch (e) {
    res.status(200).json({ error: 'confirm_error', detail: String(e?.message ?? e) })
  }
}

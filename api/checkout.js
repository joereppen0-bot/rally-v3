import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { eventId, amount } = body
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return res.status(200).json({ error: 'no_stripe_key' })
  if (!eventId) return res.status(400).json({ error: 'eventId_required' })

  const stripe = new Stripe(key)
  const cents = Math.max(99, Math.round((Number(amount) || 0.99) * 100)) // minimum $0.99
  const origin = req.headers.origin || `https://${req.headers.host}`

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Promote your protest on Rally', description: 'Publish to everyone + pin to the top of the list' },
          unit_amount: cents,
        },
        quantity: 1,
      }],
      metadata: { eventId },
      success_url: `${origin}/?confirm={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=1`,
    })
    res.status(200).json({ url: session.url })
  } catch (e) {
    res.status(200).json({ error: 'stripe_error', detail: String(e?.message ?? e) })
  }
}

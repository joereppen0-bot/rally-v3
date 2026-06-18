# Paid promotion — setup

Rally lets signed-in users post events **privately for free**, and pay **$0.99** to
**publish to everyone + pin to the top**. Before charging, an AI check confirms the
protest is **real and appropriate**; only a passing event is charged. After **3 failed
checks**, promoting locks for that account.

This needs three services live (all set in **Vercel → Settings → Environment Variables**,
then **Redeploy**):

| Variable | Service | Used for |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic | AI screening (real + appropriate) + summaries |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase | accounts, private vs public events, 3-try lock |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase | server-side promote after payment (in `/api/confirm`) |
| `STRIPE_SECRET_KEY` | Stripe | create checkout + verify payment |

> `SUPABASE_URL` is the same value as `VITE_SUPABASE_URL`. The **service role key** is
> under Supabase → Project Settings → API → `service_role` (secret) — never expose it with
> a `VITE_` prefix; it's only read by `/api/confirm`.

## Stripe setup
1. Create an account at **stripe.com** and finish activation (so you can accept live payments).
2. **Developers → API keys** → copy the **Secret key** (`sk_live_…`, or `sk_test_…` to test first).
3. In Vercel, add `STRIPE_SECRET_KEY` = that value → **Save** → **Redeploy**.
4. No webhook needed — `/api/confirm` verifies each payment with Stripe when the buyer
   returns to the site, then flips the event to public + promoted.

## Supabase (re-run the schema)
The promotion feature added new columns + a `promo_gate` table + policies. In Supabase
**SQL Editor**, run `supabase/schema.sql` again (it's safe to re-run — it uses
`add column if not exists` / `create ... if not exists`).

## How the money works
- Buyer pays $0.99. **Stripe fee ≈ $0.33** (2.9% + $0.30). AI check ≈ $0.05–0.10.
  **Net ≈ $0.55** per promotion.
- You can raise the price in `api/checkout.js` (`PRICE` is set in `SubmitView.jsx` for the
  button label; the minimum enforced server-side is $0.99).

## Test flow
Sign in → add an event → "Publish to everyone & pin to top" → AI check runs → on pass you
go to Stripe Checkout (use test card `4242 4242 4242 4242`, any future date/CVC in test
mode) → on return the event is public and pinned with a ★ Promoted badge.

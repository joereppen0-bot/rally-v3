# Rally 🚩

A mobile-first protest finder. Browse nearby protests on a live map, read neutral
AI-generated cause summaries, RSVP, and submit your own events.

**Stack:** React + Vite · Tailwind CSS · Supabase (auth + Postgres) · Mapbox GL JS ·
Claude API (`claude-sonnet-4-6`) via a Supabase Edge Function · Vercel-ready.

---

## Features

- **Map view** — full-screen Mapbox map centred on your location, pins clustered by proximity, tap a pin for a bottom sheet of details.
- **Filter bar** — All · Rights · Environment · Labour · Government · Other.
- **Event detail sheet** — date/time, address, organiser, expected attendance, **"What is this about?"** (Claude-generated 2-3 sentence neutral summary, cached in Supabase), RSVP, and native share.
- **List view** — cards sorted by distance from you.
- **Submit flow** — organiser form; address geocoded via Mapbox; events land as `pending` and **auto-approve after 10 minutes**.
- **Auth** — Supabase email magic link only (no passwords). Required to RSVP or submit; browsing is open.
- **Design** — dark mode, primary `#FF4444`, bottom nav (Map · List · Submit · Profile), 375px base, works on desktop.

> **Demo mode:** with no env vars set, the app still runs end-to-end using local seed data so you can click through every screen. Add the env vars below to go live.

---

## Quick start

```bash
npm install
cp .env.example .env      # fill in your keys
npm run dev               # http://localhost:5173
```

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | frontend | Supabase anon/public key |
| `VITE_MAPBOX_TOKEN` | frontend | Mapbox public token (`pk.…`) |
| `ANTHROPIC_API_KEY` | **server only** | Claude key — set as a Supabase secret, never exposed to the browser |

The `ANTHROPIC_API_KEY` is used exclusively inside the `summarize` Edge Function. The
browser calls the function; the function calls Claude. The key never ships to the client.

---

## Supabase setup

1. **Create a project** at [supabase.com](https://supabase.com).
2. **Initialise the schema** — open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). It creates the `events` and `rsvps` tables, enums, RLS policies, and helper RPCs (`rsvp_event`, `auto_approve_events`, `set_event_summary`).
3. **Seed sample data** — run [`supabase/seed.sql`](supabase/seed.sql) (15 events across NYC, LA, Chicago, Austin, Seattle).
4. **Enable email auth** — Authentication → Providers → Email → enable, with "magic link" on.
5. **Deploy the Edge Function:**

   ```bash
   supabase login
   supabase link --project-ref <your-ref>
   supabase functions deploy summarize
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into Edge Functions automatically.

### Schema

```
events: id, name, cause_category, description, date, address, lat, lng,
        organiser_name, organiser_email, attendance_count, status, ai_summary,
        created_by, created_at
rsvps:  id, event_id, user_id, created_at
```

`ai_summary` caches the Claude output so the same event never re-calls the API.

### Auto-approve

`auto_approve_events()` flips any `pending` event older than 10 minutes to `approved`.
The client calls it on load. For hands-off operation on Supabase Pro+, uncomment the
`pg_cron` schedule at the bottom of `schema.sql`.

---

## Claude integration

On opening an event, the app calls the `summarize` Edge Function with the event id.
The function returns the cached `ai_summary` if present; otherwise it calls Claude:

- **System:** *"You are a neutral, factual summariser. Summarise protest causes in plain English without political bias. Always 2-3 sentences. Never take sides."*
- **User:** `event name` + `description`

…then caches the result on the event row.

---

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework auto-detected as Vite).
2. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_MAPBOX_TOKEN` in
   Project → Settings → Environment Variables.
3. Deploy. `vercel.json` handles the SPA rewrite.

The `ANTHROPIC_API_KEY` lives in Supabase (the Edge Function), **not** Vercel.

---

## Project structure

```
rally/
├─ index.html
├─ vite.config.js · tailwind.config.js · postcss.config.js · vercel.json
├─ .env.example
├─ supabase/
│  ├─ schema.sql            # tables, enums, RLS, RPCs
│  ├─ seed.sql              # 15 sample events
│  └─ functions/summarize/  # Claude proxy Edge Function (Deno)
└─ src/
   ├─ App.jsx · main.jsx · index.css
   ├─ context/AuthContext.jsx
   ├─ hooks/useEvents.js · useGeolocation.js
   ├─ lib/supabase.js · mapbox.js · categories.js · format.js
   ├─ data/seedEvents.js    # demo-mode fallback data
   └─ components/MapView · ListView · SubmitView · ProfileView ·
      BottomNav · FilterBar · EventBottomSheet · AuthModal · Icons
```

## License

MIT

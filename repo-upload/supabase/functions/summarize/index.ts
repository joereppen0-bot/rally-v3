// ============================================================
// Rally — "summarize" Supabase Edge Function (Deno)
// Generates a neutral, plain-English summary of a protest cause
// via the Claude API, then caches it on the event row.
//
// Deploy:   supabase functions deploy summarize
// Secret:   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// The ANTHROPIC_API_KEY never reaches the browser — it lives only
// in this server-side function.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const MODEL = 'claude-sonnet-4-6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { eventId } = await req.json()
    if (!eventId) return json({ error: 'eventId is required' }, 400)

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

    if (!ANTHROPIC_API_KEY) return json({ error: 'Server is missing ANTHROPIC_API_KEY' }, 500)

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    // 1) Load the event.
    const { data: event, error } = await admin
      .from('events')
      .select('id, name, description, ai_summary')
      .eq('id', eventId)
      .single()

    if (error || !event) return json({ error: 'Event not found' }, 404)

    // 2) Return cached summary if we already have one.
    if (event.ai_summary && event.ai_summary.trim().length > 0) {
      return json({ summary: event.ai_summary, cached: true })
    }

    // 3) Call Claude.
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system:
          'You are a neutral, factual summariser. Summarise protest causes in plain English without political bias. Always 2-3 sentences. Never take sides.',
        messages: [
          {
            role: 'user',
            content: `${event.name}\n\n${event.description || ''}`.trim(),
          },
        ],
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      return json({ error: 'Claude API error', detail }, 502)
    }

    const data = await res.json()
    const summary: string =
      (data?.content ?? [])
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n')
        .trim() || 'No summary available.'

    // 4) Cache it on the event row.
    await admin.rpc('set_event_summary', { p_event_id: eventId, p_summary: summary })

    return json({ summary, cached: false })
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500)
  }
})

// ============================================================
// Rally — "verify-event" Edge Function (Deno)
// Uses Claude's web_search tool to check whether a submitted
// protest plausibly exists before it is added to the map.
//
// Deploy: supabase functions deploy verify-event
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ============================================================

const MODEL = 'claude-sonnet-4-6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { event } = await req.json()
    if (!event?.name) return json({ error: 'event is required' }, 400)

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) return json({ verdict: 'uncertain', reason: 'Server missing ANTHROPIC_API_KEY', sources: [] })

    const when = event.date ? new Date(event.date).toDateString() : 'an upcoming date'
    const prompt =
      `Use web search to check whether the following protest/demonstration is real and publicly announced.\n\n` +
      `Name: ${event.name}\n` +
      `Organiser: ${event.organiser_name || 'unknown'}\n` +
      `Location: ${event.address || 'unknown'}\n` +
      `Date: ${when}\n` +
      `Description: ${event.description || 'n/a'}\n\n` +
      `Search for the organiser, the event name, and the cause. Then respond with ONLY a JSON object ` +
      `(no markdown) of the form: {"verdict":"verified|unverified|uncertain","reason":"<one sentence>","sources":["<url>", ...]}. ` +
      `Use "verified" if you find credible evidence it exists or is announced, "unverified" if it appears fabricated or you find ` +
      `clear evidence it does not exist, and "uncertain" if the web is inconclusive.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      return json({ verdict: 'uncertain', reason: 'Verification service error', detail, sources: [] }, 200)
    }

    const data = await res.json()
    const text = (data?.content ?? [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')

    // Extract the JSON object from the final text.
    let parsed = { verdict: 'uncertain', reason: 'Could not parse verification result.', sources: [] as string[] }
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try { parsed = JSON.parse(match[0]) } catch { /* keep default */ }
    }
    return json(parsed)
  } catch (e) {
    return json({ verdict: 'uncertain', reason: String(e?.message ?? e), sources: [] }, 200)
  }
})

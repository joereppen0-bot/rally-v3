// Shared Claude logic for /api/ai. Runs server-side only (key never reaches the browser).
const MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const headers = (key) => ({
  'x-api-key': key,
  'anthropic-version': '2023-06-01',
  'content-type': 'application/json',
})

export async function handleAI(payload, apiKey) {
  if (!apiKey) return { error: 'no_key' }
  const { type, event } = payload || {}
  if (!event?.name) return { error: 'bad_request' }

  if (type === 'summary') {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: 'You are a neutral, factual summariser. Summarise protest causes in plain English without political bias. Always 2-3 sentences. Never take sides.',
        messages: [{ role: 'user', content: `${event.name}\n\n${event.description || ''}`.trim() }],
      }),
    })
    if (!res.ok) return { error: 'api_error', detail: await res.text() }
    const data = await res.json()
    const summary = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
    return { summary: summary || 'No summary available.' }
  }

  if (type === 'verify') {
    const when = event.date ? new Date(event.date).toDateString() : 'an upcoming date'
    const prompt =
      `Use web search to check whether the following protest/demonstration is real and publicly announced.\n\n` +
      `Name: ${event.name}\nOrganiser: ${event.organiser_name || 'unknown'}\n` +
      `Location: ${event.address || 'unknown'}\nDate: ${when}\nDescription: ${event.description || 'n/a'}\n\n` +
      `Search the organiser, event name, and cause. Then respond with ONLY a JSON object (no markdown) of the form: ` +
      `{"verdict":"verified|unverified|uncertain","reason":"<one sentence>","sources":["<url>"]}. ` +
      `Use "verified" if you find credible evidence it exists/announced, "unverified" if it appears fabricated, ` +
      `"uncertain" if the web is inconclusive.`
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return { verdict: 'uncertain', reason: 'Verification service error.', sources: [] }
    const data = await res.json()
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n')
    const m = text.match(/\{[\s\S]*\}/)
    if (m) { try { return JSON.parse(m[0]) } catch { /* fallthrough */ } }
    return { verdict: 'uncertain', reason: 'Could not parse verification result.', sources: [] }
  }

  return { error: 'bad_type' }
}

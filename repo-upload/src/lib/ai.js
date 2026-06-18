async function callAI(body) {
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error('ai_unavailable')
  return r.json()
}

const synthSummary = (event) =>
  `${event.organiser_name || 'Organisers'} are holding "${event.name}". ` +
  `${event.description || ''} ` +
  `It is described as a peaceful public gathering to raise awareness of the issue.`

// Neutral plain-English summary of a cause. Real AI when a key is set; labelled fallback otherwise.
export async function summarizeEvent(event) {
  try {
    const d = await callAI({ type: 'summary', event })
    if (d.error || !d.summary) throw new Error(d.error || 'no_summary')
    return d.summary
  } catch {
    return synthSummary(event)
  }
}

// Web-search check that a protest is real. Needs a key; returns 'uncertain' with guidance otherwise.
export async function verifyEvent(event) {
  try {
    const d = await callAI({ type: 'verify', event })
    if (d.error) throw new Error(d.error)
    return d
  } catch {
    return {
      verdict: 'uncertain',
      reason:
        'AI web-verification needs an Anthropic API key (add ANTHROPIC_API_KEY to your .env, then restart). Added as unverified for now.',
      sources: [],
    }
  }
}

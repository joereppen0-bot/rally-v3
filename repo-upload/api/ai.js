import { handleAI } from './_aiHandler.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  try {
    const out = await handleAI(body || {}, process.env.ANTHROPIC_API_KEY)
    res.status(200).json(out)
  } catch (e) {
    res.status(200).json({ error: 'server_error', detail: String(e?.message ?? e) })
  }
}

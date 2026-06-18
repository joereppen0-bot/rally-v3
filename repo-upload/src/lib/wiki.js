const cache = new Map()

// Fetch a real photo + background extract for a movement from Wikipedia (CORS-enabled REST API).
export async function fetchWiki(title) {
  if (!title) return null
  if (cache.has(title)) return cache.get(title)
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error('not found')
    const d = await res.json()
    const out = {
      thumbnail: d.thumbnail?.source || d.originalimage?.source || null,
      extract: d.extract || '',
      url: d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title}`,
    }
    cache.set(title, out)
    return out
  } catch {
    cache.set(title, null)
    return null
  }
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

export const formatDistance = (mi) => {
  if (mi == null) return ''
  if (mi < 0.1) return 'here'
  if (mi < 10) return `${mi.toFixed(1)} mi`
  return `${Math.round(mi)} mi`
}

export const formatCount = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`

// Single source of truth for cause categories + their colours.
export const CATEGORIES = [
  { key: 'all',         label: 'All',         color: '#FF4444' },
  { key: 'rights',      label: 'Rights',      color: '#FF4444' },
  { key: 'environment', label: 'Environment', color: '#34D399' },
  { key: 'labour',      label: 'Labour',      color: '#FBBF24' },
  { key: 'government',  label: 'Government',  color: '#60A5FA' },
  { key: 'other',       label: 'Other',       color: '#A78BFA' },
]

export const categoryColor = (key) =>
  (CATEGORIES.find((c) => c.key === key) || CATEGORIES[0]).color

export const categoryLabel = (key) =>
  (CATEGORIES.find((c) => c.key === key) || { label: 'Other' }).label

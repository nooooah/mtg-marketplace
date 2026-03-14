/**
 * Shared utility functions used across the app.
 */

import type { ScryfallCard } from '@/types'

/** Format an ISO date string as "Jan 1, 2025" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Return a human-readable relative time string: "today", "1d ago", "5d ago" */
export function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

/** Extract the best available image URL from a Scryfall card (handles DFCs) */
export function getCardImage(card: ScryfallCard): string | null {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null
}

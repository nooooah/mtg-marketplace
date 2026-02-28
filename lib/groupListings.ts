import type { Listing } from '@/types'

export interface GroupedListing extends Listing {
  sellerCount: number
}

/**
 * Groups listings by card_id (same printing).
 * The representative entry is the lowest-priced listing.
 * Quantity is summed across all listings in the group.
 */
export function groupListings(listings: Listing[]): GroupedListing[] {
  const map = new Map<string, Listing[]>()

  for (const l of listings) {
    const key = l.card_id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(l)
  }

  return Array.from(map.values()).map(group => {
    // Sort cheapest first so the tile shows the best available price
    const sorted = [...group].sort((a, b) => a.price - b.price)
    const cheapest = sorted[0]
    const totalQty = group.reduce((sum, l) => sum + l.quantity, 0)
    const sellerCount = new Set(group.map(l => l.user_id)).size

    return { ...cheapest, quantity: totalQty, sellerCount }
  })
}

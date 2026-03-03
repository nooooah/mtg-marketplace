import type { Listing } from '@/types'

export interface GroupedListing extends Listing {
  sellerCount: number
}

/**
 * Groups listings by card_id (same printing).
 * - If any listing in the group is 'listed' with quantity > 0, the group is in-stock.
 *   The representative entry is the lowest-priced available listing.
 * - If all listings are 'sold' or have quantity 0, the group is sold-out.
 *   Quantity is set to 0 so CardTile shows the "Sold Out" badge.
 * Sold-out groups are pushed to the end of the array.
 */
export function groupListings(listings: Listing[]): GroupedListing[] {
  const map = new Map<string, Listing[]>()

  for (const l of listings) {
    const key = l.card_id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(l)
  }

  const inStock: GroupedListing[] = []
  const soldOut: GroupedListing[] = []

  for (const group of map.values()) {
    const available = group.filter(
      l => (l.status ?? 'listed') === 'listed' && l.quantity > 0,
    )

    if (available.length > 0) {
      // In-stock: use cheapest available listing as representative
      const sorted = [...available].sort((a, b) => a.price - b.price)
      const cheapest = sorted[0]
      const totalQty = available.reduce((sum, l) => sum + l.quantity, 0)
      const sellerCount = new Set(available.map(l => l.user_id)).size
      inStock.push({ ...cheapest, quantity: totalQty, sellerCount })
    } else {
      // Sold-out: use most recently updated listing as representative
      const sorted = [...group].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      const representative = sorted[0]
      soldOut.push({ ...representative, quantity: 0, sellerCount: 0 })
    }
  }

  return [...inStock, ...soldOut]
}

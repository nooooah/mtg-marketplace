/**
 * backfill-usd-prices.mjs
 *
 * Fetches the Scryfall USD price for every listing that doesn't have one yet,
 * then updates usd_price in Supabase.
 *
 * Usage:
 *   node scripts/backfill-usd-prices.mjs
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← add this from Supabase Dashboard → Settings → API
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    const lines = readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // .env.local not found — assume env vars are already set
  }
}
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchScryfallPrice(cardId) {
  const res = await fetch(`https://api.scryfall.com/cards/${cardId}`)
  if (!res.ok) return null
  const card = await res.json()
  return {
    usd: card.prices?.usd ? parseFloat(card.prices.usd) : null,
    usd_foil: card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : null,
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching listings with missing usd_price...')

  // Fetch in pages of 1000 to handle large tables
  let allListings = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('listings')
      .select('id, card_id, is_foil')
      .is('usd_price', null)
      .range(from, from + PAGE - 1)

    if (error) { console.error('Supabase fetch error:', error.message); process.exit(1) }
    if (!data || data.length === 0) break
    allListings = allListings.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }

  console.log(`Found ${allListings.length} listings to backfill.`)
  if (allListings.length === 0) {
    console.log('Nothing to do. All listings already have a usd_price.')
    return
  }

  // Group by card_id to minimise Scryfall API calls
  const byCardId = {}
  for (const l of allListings) {
    if (!byCardId[l.card_id]) byCardId[l.card_id] = []
    byCardId[l.card_id].push(l)
  }

  const uniqueCardIds = Object.keys(byCardId)
  console.log(`Fetching prices for ${uniqueCardIds.length} unique cards from Scryfall...`)

  let updated = 0
  let skipped = 0
  let errored = 0

  for (let i = 0; i < uniqueCardIds.length; i++) {
    const cardId = uniqueCardIds[i]
    const listings = byCardId[cardId]

    // Scryfall rate limit: stay well under 10 req/s
    if (i > 0) await sleep(120)

    const prices = await fetchScryfallPrice(cardId).catch(() => null)
    if (!prices) {
      console.warn(`  [${i + 1}/${uniqueCardIds.length}] No price data for card ${cardId} — skipping ${listings.length} listing(s)`)
      skipped += listings.length
      continue
    }

    // Build per-listing updates
    const updates = listings.map((l) => ({
      id: l.id,
      usd_price: l.is_foil
        ? (prices.usd_foil ?? prices.usd ?? null)
        : (prices.usd ?? null),
    }))

    // Upsert in one call per card
    const { error } = await supabase
      .from('listings')
      .upsert(updates, { onConflict: 'id' })

    if (error) {
      console.error(`  [${i + 1}/${uniqueCardIds.length}] Update failed for card ${cardId}:`, error.message)
      errored += listings.length
    } else {
      const sample = updates[0].usd_price
      console.log(`  [${i + 1}/${uniqueCardIds.length}] ${cardId} → $${sample ?? 'N/A'} (${listings.length} listing(s))`)
      updated += listings.length
    }
  }

  console.log('\n── Done ──────────────────────────────────')
  console.log(`  Updated : ${updated}`)
  console.log(`  Skipped : ${skipped} (no Scryfall price)`)
  console.log(`  Errored : ${errored}`)
}

main()

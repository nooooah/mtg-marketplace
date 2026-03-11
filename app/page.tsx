import Link from 'next/link'
import CardTile from '@/components/CardTile'
import HomeSearchBar from '@/components/HomeSearchBar'
import { createClient } from '@/lib/supabase/server'
import { groupListings } from '@/lib/groupListings'
import type { Listing } from '@/types'

export const revalidate = 60

async function getLatestListings(): Promise<Listing[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username, avatar_url)')
      .eq('status', 'listed')
      .not('binder_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(54) // fetch extra so grouping still fills 3 rows (~18 unique cards)
    return (data as Listing[]) ?? []
  } catch {
    return []
  }
}

async function getLowerThanMarketListings(): Promise<Listing[]> {
  try {
    const supabase = await createClient()
    // Fetch listings that have a known USD price so we can compute the multiplier
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username, avatar_url)')
      .eq('status', 'listed')
      .not('binder_id', 'is', null)
      .not('usd_price', 'is', null)
      .gt('usd_price', 0)
      .order('created_at', { ascending: false })
      .limit(120) // fetch enough to find low-multiplier cards after grouping
    const listings = (data as Listing[]) ?? []
    // Keep only listings that bucket into ×30 or ×40 (mult ≤ 40)
    return listings
      .filter(l => l.usd_price && Math.round(l.price / l.usd_price) <= 40)
      .sort((a, b) => (a.price / a.usd_price!) - (b.price / b.usd_price!))
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [latest, lowerThanMarket] = await Promise.all([
    getLatestListings(),
    getLowerThanMarketListings(),
  ])

  return (
    <div className="page-wrap" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* Search bar */}
      <section style={{ paddingTop: '48px', marginBottom: '40px' }}>
        <HomeSearchBar />
      </section>

      {/* Hero CTA */}
      <section style={{ marginBottom: '56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h2 style={{
            fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, lineHeight: 1.15,
            fontFamily: "'Beleren2016', serif", letterSpacing: '-0.02em', margin: 0,
            background: 'linear-gradient(135deg, #f8fafc 40%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Find what you need. List what you don&apos;t.
          </h2>
          <Link href="/sell" style={{
            display: 'inline-block', padding: '10px 22px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            color: '#fff', fontSize: '14px', fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 3px 14px rgba(124,58,237,0.28)',
            flexShrink: 0,
          }}>
            Join for free →
          </Link>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
          Add your binder to the database and get discovered by local buyers.
        </p>
      </section>

      {/* Latest Listings */}
      <section style={{ marginBottom: '56px' }}>
        <SectionHeader label="Latest Listings" description="Freshly listed cards from the community" href="/buy" linkLabel="Browse all" />
        <ListingGrid listings={latest} maxCards={18} emptyLabel="No listings yet — be the first to list a card!" />
      </section>

      {/* Lower Than Market */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHeader label="Lower Than Market" description="Cards listed below the usual market rate" href="/buy?ltm=1" linkLabel="Browse all" />
        <ListingGrid listings={lowerThanMarket} maxCards={12} emptyLabel="No below-market listings right now. Check back soon." />
      </section>
    </div>
  )
}

function SectionHeader({ label, description, href, linkLabel }: { label: string; description?: string; href: string; linkLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
      <div>
        <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{label}</h2>
        {description && <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>{description}</p>}
      </div>
      <Link href={href} style={{ fontSize: '12px', color: 'var(--color-muted)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{linkLabel} →</Link>
    </div>
  )
}

function ListingGrid({ listings, maxCards, emptyLabel }: { listings: Listing[]; maxCards: number; emptyLabel: string }) {
  if (listings.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: '14px' }}>
        {emptyLabel}
      </div>
    )
  }
  const grouped = groupListings(listings).slice(0, maxCards)
  return (
    <div className="card-grid">
      {grouped.map(listing => (
        <CardTile
          key={listing.card_id}
          listing={listing}
          noPreview
          sellerCount={listing.sellerCount}
          href={`/card/${listing.card_id}`}
        />
      ))}
    </div>
  )
}


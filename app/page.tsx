import Link from 'next/link'
import EventsBanner from '@/components/EventsBanner'
import CardTile from '@/components/CardTile'
import { createClient } from '@/lib/supabase/server'
import { groupListings } from '@/lib/groupListings'
import type { Listing } from '@/types'

export const revalidate = 60

async function getFeaturedListings(): Promise<Listing[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(8)
    return (data as Listing[]) ?? []
  } catch {
    return []
  }
}

async function getHotListings(): Promise<Listing[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username, avatar_url)')
      .order('views', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8)
    return (data as Listing[]) ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [featured, hot] = await Promise.all([
    getFeaturedListings(),
    getHotListings(),
  ])

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* Events Banner */}
      <section style={{ marginBottom: '56px', paddingTop: '36px' }}>
        <EventsBanner />
      </section>

      {/* Featured Listings */}
      <section style={{ marginBottom: '56px' }}>
        <SectionHeader label="Featured Listings" description="Freshly listed cards from the community" href="/buy" linkLabel="Browse all" />
        <ListingGrid listings={featured} emptyLabel="No listings yet — be the first to list a card!" />
      </section>

      {/* Hot Right Now */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHeader label="Hot Right Now" description="Most viewed and recently active listings" href="/buy?sort=hot" linkLabel="See more" />
        <ListingGrid listings={hot} emptyLabel="Nothing trending yet. Check back soon." />
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

function ListingGrid({ listings, emptyLabel }: { listings: Listing[]; emptyLabel: string }) {
  if (listings.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: '14px' }}>
        {emptyLabel}
      </div>
    )
  }
  const grouped = groupListings(listings)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
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


import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MessageButton from './MessageButton'
import type { Listing } from '@/types'
import { formatDate } from '@/lib/utils'

const CONDITION_LABELS: Record<string, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
}


export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles(id, username, avatar_url, bio, created_at)')
    .eq('id', id)
    .eq('status', 'listed')
    .single()

  if (!listing) notFound()

  // Increment view count (fire and forget)
  supabase.rpc('increment_listing_views', { listing_id: id }).then(() => {})

  const l = listing as Listing
  const seller = l.profiles
  const imageUrl = l.card_image_uri
  const condition = l.condition

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 1.5rem 80px' }}>

      {/* Back */}
      <Link href="/buy" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', marginBottom: '28px' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
      >
        <ArrowLeft /> Back to listings
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr)', gap: '48px', alignItems: 'start' }}>

        {/* LEFT: Card image */}
        <div>
          <div style={{
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            aspectRatio: '3/4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {imageUrl ? (
              <img src={imageUrl} alt={l.card_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ color: 'var(--color-subtle)', fontSize: '13px' }}>No image available</div>
            )}
          </div>
        </div>

        {/* RIGHT: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Card name + set */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className={`badge badge-${condition.toLowerCase()}`}>{condition} · {CONDITION_LABELS[condition]}</span>
              {l.is_foil && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '11px', fontWeight: 700, color: '#fbbf24',
                  background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.35)',
                  padding: '2px 8px', borderRadius: '6px',
                }}>
                  ✦ Foil
                </span>
              )}
              {l.card_rarity && (
                <span style={{ fontSize: '11px', color: 'var(--color-subtle)', textTransform: 'capitalize' }}>{l.card_rarity}</span>
              )}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', margin: '0 0 6px' }}>
              {l.card_name}
            </h1>
            {l.card_set_name && (
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
                {l.card_set_name}
                {l.card_set && <span style={{ color: 'var(--color-subtle)' }}> · {l.card_set.toUpperCase()}</span>}
              </p>
            )}
            {l.card_type && (
              <p style={{ fontSize: '13px', color: 'var(--color-subtle)', marginTop: '4px' }}>{l.card_type}</p>
            )}
          </div>

          {/* Price + quantity */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', padding: '20px 24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
            <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
              ₱{l.price.toLocaleString('en-PH')}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              {l.quantity > 1 ? `${l.quantity} available` : '1 available'}
            </span>
          </div>

          {/* Message seller */}
          <MessageButton listingId={l.id} sellerId={l.user_id} sellerUsername={seller?.username ?? 'Seller'} />

          {/* Notes */}
          {l.notes && (
            <div style={{ padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seller notes</p>
              <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6, margin: 0 }}>{l.notes}</p>
            </div>
          )}

          {/* Seller card */}
          {seller && (
            <Link href={`/profile/${seller.username}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 20px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                transition: 'border-color 0.15s ease',
              }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-2)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)')}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {seller.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)', margin: '0 0 2px' }}>{seller.username}</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
                    Member since {formatDate(seller.created_at ?? '')}
                  </p>
                </div>
                <ArrowRight />
              </div>
            </Link>
          )}

          {/* Meta */}
          <p style={{ fontSize: '12px', color: 'var(--color-subtle)', marginTop: '-8px' }}>
            Listed {formatDate(l.created_at)} · {l.views} view{l.views !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

function ArrowLeft() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
}
function ArrowRight() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-muted)' }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
}

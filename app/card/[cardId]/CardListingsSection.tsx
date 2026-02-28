'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Listing, CardCondition } from '@/types'

const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: 'Near Mint', LP: 'Lightly Played', MP: 'Moderately Played',
  HP: 'Heavily Played', DMG: 'Damaged',
}

const CONDITION_COLORS: Record<CardCondition, string> = {
  NM: '#22c55e', LP: '#3b82f6', MP: '#f59e0b', HP: '#f97316', DMG: '#ef4444',
}

type Sort = 'price_asc' | 'price_desc' | 'condition' | 'newest'

export default function CardListingsSection({
  listings,
  cardId,
}: {
  listings: Listing[]
  cardId: string
}) {
  const [sort, setSort] = useState<Sort>('price_asc')
  const [foilOnly, setFoilOnly] = useState(false)
  const [conditions, setConditions] = useState<Set<CardCondition>>(new Set())

  const conditionOrder: CardCondition[] = ['NM', 'LP', 'MP', 'HP', 'DMG']

  const filtered = useMemo(() => {
    let result = [...listings]
    if (foilOnly) result = result.filter(l => l.is_foil)
    if (conditions.size > 0) result = result.filter(l => conditions.has(l.condition))
    switch (sort) {
      case 'price_asc':  result.sort((a, b) => a.price - b.price); break
      case 'price_desc': result.sort((a, b) => b.price - a.price); break
      case 'condition':  result.sort((a, b) => conditionOrder.indexOf(a.condition) - conditionOrder.indexOf(b.condition)); break
      case 'newest':     result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
    }
    return result
  }, [listings, sort, foilOnly, conditions])

  const toggleCondition = (c: CardCondition) => {
    setConditions(prev => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  if (listings.length === 0) {
    return (
      <div style={{
        padding: '32px', background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: '14px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 6px' }}>
          No listings yet
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 16px' }}>
          Be the first to sell this card in the community.
        </p>
        <Link href="/sell" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 18px', background: 'var(--color-blue)',
          color: '#fff', borderRadius: '8px', fontSize: '13px',
          fontWeight: 600, textDecoration: 'none',
        }}>
          List this card →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Condition filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {conditionOrder.map(c => (
            <button
              key={c}
              onClick={() => toggleCondition(c)}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                border: `1.5px solid ${conditions.has(c) ? CONDITION_COLORS[c] : 'var(--color-border)'}`,
                background: conditions.has(c) ? `${CONDITION_COLORS[c]}20` : 'transparent',
                color: conditions.has(c) ? CONDITION_COLORS[c] : 'var(--color-muted)',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Foil toggle */}
        <button
          onClick={() => setFoilOnly(f => !f)}
          style={{
            padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
            border: `1.5px solid ${foilOnly ? 'rgba(234,179,8,0.6)' : 'var(--color-border)'}`,
            background: foilOnly ? 'rgba(234,179,8,0.1)' : 'transparent',
            color: foilOnly ? '#fbbf24' : 'var(--color-muted)',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
        >
          ✦ Foil only
        </button>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as Sort)}
          style={{
            marginLeft: 'auto', padding: '5px 10px',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '8px', fontSize: '12px', color: 'var(--color-text)', cursor: 'pointer',
          }}
        >
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="condition">Best Condition</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Result count */}
      <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
        {filtered.length} of {listings.length} listing{listings.length !== 1 ? 's' : ''}
      </p>

      {/* Listings table */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: '14px', background: 'var(--color-surface)', overflowX: 'auto' }}>
        <div style={{ minWidth: '480px' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 80px 60px 100px 44px',
          gap: '12px', padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          fontSize: '11px', fontWeight: 600,
          color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <span>Seller</span>
          <span>Condition</span>
          <span>Finish</span>
          <span>Qty</span>
          <span style={{ textAlign: 'right' }}>Price</span>
          <span />
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '13px' }}>
            No listings match your filters.
          </div>
        ) : (
          filtered.map((listing, i) => (
            <ListingRow key={listing.id} listing={listing} isLast={i === filtered.length - 1} />
          ))
        )}
        </div>
      </div>
    </div>
  )
}

function ListingRow({ listing, isLast }: { listing: Listing; isLast: boolean }) {
  const [hovering, setHovering] = useState(false)
  const seller = listing.profiles
  const sellerInitial = (seller?.display_name ?? seller?.username ?? '?')[0].toUpperCase()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 100px 80px 60px 100px 44px',
        gap: '12px', padding: '12px 16px', alignItems: 'center',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        background: hovering ? 'var(--color-surface-2)' : 'transparent',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Seller */}
      <Link
        href={`/profile/${seller?.username}`}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--color-blue)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '11px', fontWeight: 700,
          color: '#fff', flexShrink: 0,
        }}>
          {sellerInitial}
        </div>
        <span style={{
          fontSize: '13px', fontWeight: 500, color: 'var(--color-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {seller?.display_name ?? seller?.username ?? 'Seller'}
        </span>
      </Link>

      {/* Condition */}
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        fontSize: '11px', fontWeight: 700, color: conditionColor(listing.condition),
        background: `${conditionColor(listing.condition)}18`,
        border: `1px solid ${conditionColor(listing.condition)}40`,
        padding: '3px 8px', borderRadius: '6px', width: 'fit-content',
      }}>
        {listing.condition}
      </span>

      {/* Finish */}
      <span style={{ fontSize: '12px', color: listing.is_foil ? '#fbbf24' : 'var(--color-muted)', fontWeight: listing.is_foil ? 700 : 400 }}>
        {listing.is_foil ? '✦ Foil' : 'Non-Foil'}
      </span>

      {/* Qty */}
      <span style={{ fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center' }}>
        {listing.quantity}
      </span>

      {/* Price */}
      <span style={{
        fontSize: '15px', fontWeight: 700, color: 'var(--color-text)',
        textAlign: 'right',
      }}>
        ₱{listing.price.toLocaleString('en-PH')}
      </span>

      {/* Message */}
      <MessageBtn listingId={listing.id} sellerId={listing.user_id} />
    </div>
  )
}

function conditionColor(c: string) {
  const map: Record<string, string> = {
    NM: '#22c55e', LP: '#3b82f6', MP: '#f59e0b', HP: '#f97316', DMG: '#ef4444',
  }
  return map[c] ?? '#94a3b8'
}

function MessageBtn({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  return (
    <button
      onClick={() => { window.location.href = `/messages/new?listing=${listingId}&to=${sellerId}` }}
      title="Message seller"
      style={{
        width: '32px', height: '32px', borderRadius: '8px',
        border: '1px solid var(--color-border)', background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-muted)', cursor: 'pointer', padding: 0,
        transition: 'all 0.15s ease', flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--color-blue-glow)'
        e.currentTarget.style.borderColor = 'var(--color-blue)'
        e.currentTarget.style.color = 'var(--color-blue)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.color = 'var(--color-muted)'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}

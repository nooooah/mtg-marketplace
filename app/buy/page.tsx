'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CardTile from '@/components/CardTile'
import { groupListings } from '@/lib/groupListings'
import type { Listing, CardCondition } from '@/types'

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'hot'

const CONDITIONS: CardCondition[] = ['NM', 'LP', 'MP', 'HP', 'DMG']
const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
}

function BuyPageContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQuery = searchParams.get('q') ?? ''
  const initialSort = (searchParams.get('sort') as SortOption) ?? 'newest'

  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<SortOption>(initialSort)
  const [conditions, setConditions] = useState<Set<CardCondition>>(new Set())
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('listings')
      .select('*, profiles(username, avatar_url)')

    if (query.trim()) {
      q = q.ilike('card_name', `%${query.trim()}%`)
    }
    if (conditions.size > 0) {
      q = q.in('condition', Array.from(conditions))
    }
    if (minPrice) q = q.gte('price', parseFloat(minPrice))
    if (maxPrice) q = q.lte('price', parseFloat(maxPrice))

    switch (sort) {
      case 'newest':    q = q.order('created_at', { ascending: false }); break
      case 'oldest':    q = q.order('created_at', { ascending: true });  break
      case 'price_asc': q = q.order('price', { ascending: true });       break
      case 'price_desc':q = q.order('price', { ascending: false });      break
      case 'hot':       q = q.order('views', { ascending: false }).order('created_at', { ascending: false }); break
    }

    const { data } = await q.limit(48)
    setListings((data as Listing[]) ?? [])
    setLoading(false)
  }, [query, sort, conditions, minPrice, maxPrice])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const toggleCondition = (c: CardCondition) => {
    setConditions(prev => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchListings()
  }

  const activeFilterCount = conditions.size + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 1.5rem 80px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          Browse Cards
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
          Find cards listed by the community
        </p>
      </div>

      {/* Search + controls bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Search */}
        <form
          onSubmit={handleSearch}
          style={{
            flex: 1,
            minWidth: '220px',
            display: 'flex',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '9px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', color: 'var(--color-subtle)' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search card name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, border: 'none', borderRadius: 0, padding: '10px 0', background: 'transparent', fontSize: '14px' }}
          />
        </form>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          style={{ padding: '10px 12px', borderRadius: '9px', minWidth: '160px', fontSize: '13px', cursor: 'pointer' }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="hot">Most viewed</option>
        </select>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 14px',
            borderRadius: '9px',
            background: filtersOpen ? 'var(--color-blue-glow)' : 'var(--color-surface)',
            border: `1px solid ${filtersOpen ? 'rgba(59,130,246,0.35)' : 'var(--color-border)'}`,
            color: filtersOpen ? 'var(--color-blue)' : 'var(--color-muted)',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
        >
          <FilterIcon />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: 'var(--color-blue)', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', fontWeight: 700 }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '20px',
            display: 'flex',
            gap: '32px',
            flexWrap: 'wrap',
          }}
        >
          {/* Condition */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Condition
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CONDITIONS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '7px',
                    border: `1px solid ${conditions.has(c) ? 'var(--color-blue)' : 'var(--color-border)'}`,
                    background: conditions.has(c) ? 'var(--color-blue-glow)' : 'transparent',
                    color: conditions.has(c) ? 'var(--color-blue)' : 'var(--color-muted)',
                    fontSize: '12px',
                    fontWeight: conditions.has(c) ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c} <span style={{ opacity: 0.6 }}>· {CONDITION_LABELS[c]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Price Range (₱)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                placeholder="Min ₱"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                style={{ width: '90px', padding: '7px 10px', fontSize: '13px' }}
                min="0"
                step="1"
              />
              <span style={{ color: 'var(--color-subtle)', fontSize: '12px' }}>to</span>
              <input
                type="number"
                placeholder="Max ₱"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                style={{ width: '90px', padding: '7px 10px', fontSize: '13px' }}
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => { setConditions(new Set()); setMinPrice(''); setMaxPrice('') }}
                style={{ background: 'transparent', color: 'var(--color-muted)', fontSize: '12px', padding: '7px 12px', border: '1px solid var(--color-border)', borderRadius: '7px' }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <SkeletonGrid />
      ) : listings.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '15px', color: 'var(--color-muted)', marginBottom: '8px' }}>No listings found.</p>
          <p style={{ fontSize: '13px', color: 'var(--color-subtle)' }}>Try a different search or clear your filters.</p>
        </div>
      ) : (
        <>
          {(() => {
            const grouped = groupListings(listings)
            return (
              <>
                <p style={{ fontSize: '12px', color: 'var(--color-subtle)', marginBottom: '16px' }}>
                  {grouped.length} card{grouped.length !== 1 ? 's' : ''} found
                  {grouped.length !== listings.length && (
                    <span style={{ color: 'var(--color-subtle)' }}> ({listings.length} listing{listings.length !== 1 ? 's' : ''})</span>
                  )}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  {grouped.map(listing => (
                    <CardTile
                      key={listing.card_id}
                      listing={listing}
                      sellerCount={listing.sellerCount}
                      href={`/card/${listing.card_id}`}
                    />
                  ))}
                </div>
              </>
            )
          })()}
        </>
      )}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="skeleton" style={{ aspectRatio: '3/4' }} />
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ height: '14px', width: '80%' }} />
            <div className="skeleton" style={{ height: '12px', width: '55%' }} />
            <div className="skeleton" style={{ height: '12px', width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function FilterIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
}

export default function BuyPage() {
  return <Suspense><BuyPageContent /></Suspense>
}

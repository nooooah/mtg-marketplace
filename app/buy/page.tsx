'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CardTile from '@/components/CardTile'
import { groupListings } from '@/lib/groupListings'
import { useDebounce } from '@/hooks/useDebounce'
import type { Listing, CardCondition } from '@/types'

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'hot'

interface ScryfallSuggestion {
  id: string
  name: string
  set_name: string
  set: string
  image_uris?: { small: string }
  card_faces?: { image_uris?: { small: string } }[]
}

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
  const initialLtm = searchParams.get('ltm') === '1'

  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<SortOption>(initialSort)
  const [conditions, setConditions] = useState<Set<CardCondition>>(new Set())
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [lowerThanMarket, setLowerThanMarket] = useState(initialLtm)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(initialLtm)

  // Scryfall suggestions
  const [suggestions, setSuggestions] = useState<ScryfallSuggestion[]>([])
  const [suggFocused, setSuggFocused] = useState(false)
  const [suggLoading, setSuggLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debouncedQuery = useDebounce(query, 280)

  const showDropdown = suggFocused && (suggestions.length > 0 || suggLoading) && query.trim().length > 1

  // Fetch Scryfall suggestions
  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 2) { setSuggestions([]); setSuggLoading(false); return }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSuggLoading(true)
    fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=name&unique=cards&page=1`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => { setSuggestions((data.data ?? []).slice(0, 6) as ScryfallSuggestion[]); setSuggLoading(false) })
      .catch(() => { setSuggLoading(false) })
  }, [debouncedQuery])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSuggFocused(false); setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const commitSuggestion = (card: ScryfallSuggestion) => {
    setQuery(card.name)
    setSuggestions([])
    setSuggFocused(false)
    setActiveIdx(-1)
    // fetchListings will trigger via useEffect
  }

  const fetchListings = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('listings')
      .select('*, profiles(username, avatar_url)')
      .eq('status', 'listed')

    if (query.trim()) {
      q = q.ilike('card_name', `%${query.trim()}%`)
    }
    if (conditions.size > 0) {
      q = q.in('condition', Array.from(conditions))
    }
    if (minPrice) q = q.gte('price', parseFloat(minPrice))
    if (maxPrice) q = q.lte('price', parseFloat(maxPrice))

    // Fetch more rows when LTM is active so client-side filtering has enough to work with
    if (lowerThanMarket) {
      q = q.not('usd_price', 'is', null).gt('usd_price', 0)
    }

    switch (sort) {
      case 'newest':    q = q.order('created_at', { ascending: false }); break
      case 'oldest':    q = q.order('created_at', { ascending: true });  break
      case 'price_asc': q = q.order('price', { ascending: true });       break
      case 'price_desc':q = q.order('price', { ascending: false });      break
      case 'hot':       q = q.order('views', { ascending: false }).order('created_at', { ascending: false }); break
    }

    const { data } = await q.limit(lowerThanMarket ? 300 : 48)
    let results = (data as Listing[]) ?? []

    if (lowerThanMarket) {
      results = results
        .filter(l => l.usd_price && Math.round(l.price / l.usd_price) <= 40)
    }

    setListings(results)
    setLoading(false)
  }, [query, sort, conditions, minPrice, maxPrice, lowerThanMarket])

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuggestions([]); setSuggFocused(false)
    fetchListings()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    if (e.key === 'Escape')    { setSuggFocused(false); setActiveIdx(-1) }
    if (e.key === 'Enter' && activeIdx >= 0 && suggestions[activeIdx]) {
      e.preventDefault(); commitSuggestion(suggestions[activeIdx])
    }
  }

  const activeFilterCount = conditions.size + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (lowerThanMarket ? 1 : 0)

  return (
    <div className="page-wrap" style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 1.5rem 80px' }}>

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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Search with suggestions */}
        <div ref={searchWrapRef} style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              background: 'var(--color-surface)',
              border: `1px solid ${suggFocused ? 'var(--color-border-2)' : 'var(--color-border)'}`,
              borderRadius: showDropdown ? '9px 9px 0 0' : '9px',
              overflow: 'hidden',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}>
              {suggLoading ? <SpinnerIcon /> : <SearchIcon />}
            </div>
            <input
              type="text"
              placeholder="Search card name…"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIdx(-1) }}
              onFocus={() => setSuggFocused(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              style={{ flex: 1, border: 'none', borderRadius: 0, padding: '10px 0', background: 'transparent', fontSize: '14px' }}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setSuggestions([]) }}
                style={{ padding: '0 12px', background: 'transparent', border: 'none', color: 'var(--color-subtle)', display: 'flex', alignItems: 'center' }}>
                <XIcon />
              </button>
            )}
          </form>

          {showDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--color-surface)', border: '1px solid var(--color-border-2)',
              borderTop: 'none', borderRadius: '0 0 10px 10px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.45)', overflow: 'hidden',
            }}>
              {suggestions.map((card, i) => {
                const img = card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small
                return (
                  <button key={card.id} type="button"
                    onMouseDown={() => commitSuggestion(card)}
                    onMouseEnter={() => setActiveIdx(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '8px 14px', textAlign: 'left',
                      background: i === activeIdx ? 'var(--color-surface-2)' : 'transparent',
                      border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-border)' : 'none',
                      cursor: 'pointer', transition: 'background 0.1s ease',
                    }}>
                    {img
                      ? <img src={img} alt="" style={{ width: '28px', height: '39px', borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '28px', height: '39px', borderRadius: '3px', background: 'var(--color-surface-2)', flexShrink: 0 }} />
                    }
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.set_name} · {card.set.toUpperCase()}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

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

          {/* Lower Than Market */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Price Tag
            </p>
            <button
              onClick={() => setLowerThanMarket(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '5px 11px', borderRadius: '7px',
                border: `1px solid ${lowerThanMarket ? '#22c55e' : 'var(--color-border)'}`,
                background: lowerThanMarket ? '#22c55e18' : 'transparent',
                color: lowerThanMarket ? '#22c55e' : 'var(--color-muted)',
                fontSize: '12px', fontWeight: lowerThanMarket ? 600 : 400,
                transition: 'all 0.15s ease', cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '4px',
                border: `1px solid ${lowerThanMarket ? '#22c55e' : 'var(--color-border)'}40`,
                background: lowerThanMarket ? '#22c55e18' : 'var(--color-surface-2)',
              }}>×40</span>
              Lower Than Market
            </button>
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => { setConditions(new Set()); setMinPrice(''); setMaxPrice(''); setLowerThanMarket(false) }}
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
                <div className="card-grid">
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
    <div className="card-grid">
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
function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  )
}
function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}

export default function BuyPage() {
  return <Suspense><BuyPageContent /></Suspense>
}

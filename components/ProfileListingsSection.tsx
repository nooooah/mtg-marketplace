'use client'

import { useState, useMemo } from 'react'
import CardTile from './CardTile'
import type { Listing, CardCondition } from '@/types'

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc'

const CONDITIONS: CardCondition[] = ['NM', 'LP', 'MP', 'HP', 'DMG']
const CONDITION_COLORS: Record<CardCondition, string> = {
  NM: 'var(--color-nm)',
  LP: 'var(--color-lp)',
  MP: 'var(--color-mp)',
  HP: 'var(--color-hp)',
  DMG: 'var(--color-dmg)',
}

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
}

export default function ProfileListingsSection({ listings }: { listings: Listing[] }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [conditions, setConditions] = useState<Set<CardCondition>>(new Set())
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleCondition = (c: CardCondition) => {
    setConditions(prev => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  const filtered = useMemo(() => {
    let result = [...listings]

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(l => l.card_name.toLowerCase().includes(q))
    }
    if (conditions.size > 0) {
      result = result.filter(l => conditions.has(l.condition as CardCondition))
    }
    if (minPrice) result = result.filter(l => l.price >= parseFloat(minPrice))
    if (maxPrice) result = result.filter(l => l.price <= parseFloat(maxPrice))

    switch (sort) {
      case 'newest':     result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
      case 'oldest':     result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
      case 'price_asc':  result.sort((a, b) => a.price - b.price); break
      case 'price_desc': result.sort((a, b) => b.price - a.price); break
    }

    return result
  }, [listings, query, sort, conditions, minPrice, maxPrice])

  const activeFilterCount = conditions.size + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)

  return (
    <div>
      {/* Search + sort toolbar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtle)', pointerEvents: 'none' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search listings…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: '34px', paddingRight: '10px', fontSize: '13px' }}
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          style={{ fontSize: '13px', padding: '8px 10px', minWidth: '160px' }}
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map(s => (
            <option key={s} value={s}>{SORT_LABELS[s]}</option>
          ))}
        </select>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            border: `1px solid ${filtersOpen || activeFilterCount > 0 ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
            background: filtersOpen || activeFilterCount > 0 ? 'var(--color-blue-glow)' : 'transparent',
            color: filtersOpen || activeFilterCount > 0 ? 'var(--color-blue)' : 'var(--color-muted)',
            cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
          }}
        >
          <FilterIcon />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: 'var(--color-blue)', color: '#fff', borderRadius: '10px', fontSize: '10px', fontWeight: 700, padding: '1px 6px', lineHeight: '16px' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '10px', padding: '16px 18px', marginBottom: '16px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {/* Condition */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Condition</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CONDITIONS.map(c => {
                const active = conditions.has(c)
                return (
                  <button key={c} onClick={() => toggleCondition(c)} style={{
                    padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                    border: `1px solid ${active ? CONDITION_COLORS[c] : 'var(--color-border)'}`,
                    background: active ? `${CONDITION_COLORS[c]}18` : 'transparent',
                    color: active ? CONDITION_COLORS[c] : 'var(--color-muted)',
                    cursor: 'pointer', transition: 'all 0.12s ease',
                  }}>
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Price Range (₱)</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" placeholder="Min ₱" value={minPrice} onChange={e => setMinPrice(e.target.value)} min="0" step="1" style={{ width: '100px', fontSize: '13px' }} />
              <span style={{ color: 'var(--color-subtle)', fontSize: '12px' }}>–</span>
              <input type="number" placeholder="Max ₱" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} min="0" step="1" style={{ width: '100px', fontSize: '13px' }} />
              {(minPrice || maxPrice) && (
                <button onClick={() => { setMinPrice(''); setMaxPrice('') }} style={{
                  fontSize: '12px', color: 'var(--color-subtle)', background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: '2px 6px',
                }}>Clear</button>
              )}
            </div>
          </div>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button onClick={() => { setConditions(new Set()); setMinPrice(''); setMaxPrice('') }} style={{
              alignSelf: 'flex-start', fontSize: '12px', color: 'var(--color-muted)',
              background: 'transparent', border: '1px solid var(--color-border)',
              borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
            }}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      <p style={{ fontSize: '12px', color: 'var(--color-subtle)', marginBottom: '14px' }}>
        {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
        {filtered.length !== listings.length && ` of ${listings.length}`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-muted)', fontSize: '14px' }}>
          No listings match your search.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '12px' }}>
          {filtered.map(l => <CardTile key={l.id} listing={l} compact href={`/card/${l.card_id}`} />)}
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function FilterIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
}

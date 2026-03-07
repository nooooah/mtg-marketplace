'use client'

import { useState, useMemo } from 'react'
import CardTile from './CardTile'
import type { Listing, CardCondition } from '@/types'

type SortOption = 'price_desc' | 'price_asc' | 'newest' | 'oldest' | 'alpha'

const CONDITIONS: CardCondition[] = ['NM', 'LP', 'MP', 'HP', 'DMG']
const CONDITION_COLORS: Record<CardCondition, string> = {
  NM: 'var(--color-nm)',
  LP: 'var(--color-lp)',
  MP: 'var(--color-mp)',
  HP: 'var(--color-hp)',
  DMG: 'var(--color-dmg)',
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'price_asc',  label: 'Price: low to high' },
  { value: 'newest',     label: 'Newest first' },
  { value: 'oldest',     label: 'Oldest first' },
  { value: 'alpha',      label: 'A → Z' },
]

const PER_PAGE_OPTIONS = [24, 48, 96]

export default function ProfileListingsSection({ listings }: { listings: Listing[] }) {
  const [query, setQuery]         = useState('')
  const [sort, setSort]           = useState<SortOption>('price_desc')
  const [conditions, setConditions] = useState<Set<CardCondition>>(new Set())
  const [minPrice, setMinPrice]   = useState('')
  const [maxPrice, setMaxPrice]   = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage]           = useState(1)
  const [perPage, setPerPage]     = useState(24)

  const resetPage = () => setPage(1)

  const toggleCondition = (c: CardCondition) => {
    setConditions(prev => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
    resetPage()
  }

  const clearFilters = () => {
    setConditions(new Set())
    setMinPrice('')
    setMaxPrice('')
    resetPage()
  }

  const filtered = useMemo(() => {
    let result = [...listings]

    if (query.trim())      result = result.filter(l => l.card_name.toLowerCase().includes(query.toLowerCase()))
    if (conditions.size > 0) result = result.filter(l => conditions.has(l.condition as CardCondition))
    if (minPrice)          result = result.filter(l => l.price >= +minPrice)
    if (maxPrice)          result = result.filter(l => l.price <= +maxPrice)

    switch (sort) {
      case 'price_desc': return result.sort((a, b) => b.price - a.price)
      case 'price_asc':  return result.sort((a, b) => a.price - b.price)
      case 'newest':     return result.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      case 'oldest':     return result.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      case 'alpha':      return result.sort((a, b) => a.card_name.localeCompare(b.card_name))
    }
  }, [listings, query, sort, conditions, minPrice, maxPrice])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const activeFilterCount = conditions.size + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)
  const filterActive = filtersOpen || activeFilterCount > 0

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>

        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtle)', pointerEvents: 'none' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search listings…"
            value={query}
            onChange={e => { setQuery(e.target.value); resetPage() }}
            style={{ paddingLeft: '34px', paddingRight: '10px', fontSize: '13px' }}
          />
        </div>

        <select
          value={sort}
          onChange={e => { setSort(e.target.value as SortOption); resetPage() }}
          style={{ fontSize: '13px', padding: '8px 10px', minWidth: '160px' }}
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <button
          onClick={() => setFiltersOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            border: `1px solid ${filterActive ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
            background: filterActive ? 'var(--color-blue-glow)' : 'transparent',
            color: filterActive ? 'var(--color-blue)' : 'var(--color-muted)',
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

          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Price Range (₱)</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" placeholder="Min ₱" value={minPrice} onChange={e => { setMinPrice(e.target.value); resetPage() }} min="0" step="1" style={{ width: '100px', fontSize: '13px' }} />
              <span style={{ color: 'var(--color-subtle)', fontSize: '12px' }}>–</span>
              <input type="number" placeholder="Max ₱" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); resetPage() }} min="0" step="1" style={{ width: '100px', fontSize: '13px' }} />
              {(minPrice || maxPrice) && (
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); resetPage() }} style={{
                  fontSize: '12px', color: 'var(--color-subtle)', background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: '2px 6px',
                }}>Clear</button>
              )}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} style={{
              alignSelf: 'flex-start', fontSize: '12px', color: 'var(--color-muted)',
              background: 'transparent', border: '1px solid var(--color-border)',
              borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
            }}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Result count + per-page */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-subtle)', margin: 0 }}>
          {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
          {filtered.length !== listings.length && ` of ${listings.length}`}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-subtle)' }}>Per page:</span>
          {PER_PAGE_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => { setPerPage(n); resetPage() }}
              style={{
                padding: '3px 9px', borderRadius: '6px', fontSize: '12px', fontWeight: perPage === n ? 700 : 500,
                border: `1px solid ${perPage === n ? 'var(--color-blue)' : 'var(--color-border)'}`,
                background: perPage === n ? 'var(--color-blue-glow)' : 'transparent',
                color: perPage === n ? 'var(--color-blue)' : 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-muted)', fontSize: '14px' }}>
          No listings match your search.
        </div>
      ) : (
        <div className="card-grid" style={{ gap: '12px' }}>
          {paginated.map(l => <CardTile key={l.id} listing={l} compact href={`/card/${l.card_id}`} />)}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        />
      )}
    </div>
  )
}

/* ─── Pagination ──────────────────────────────────────────────────────── */

function Pagination({ page, totalPages, onPageChange }: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '28px', flexWrap: 'wrap' }}>
      <PageBtn onClick={() => onPageChange(page - 1)} disabled={page === 1}>←</PageBtn>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--color-subtle)', fontSize: '13px' }}>…</span>
          : <PageBtn key={p} onClick={() => onPageChange(p as number)} active={p === page}>{p}</PageBtn>
      )}
      <PageBtn onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>→</PageBtn>
    </div>
  )
}

function PageBtn({ children, onClick, active = false, disabled = false }: {
  children: string | number
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '32px', height: '32px', padding: '0 8px',
        borderRadius: '7px', fontSize: '13px', fontWeight: active ? 700 : 500,
        border: `1px solid ${active ? 'var(--color-blue)' : 'var(--color-border)'}`,
        background: active ? 'var(--color-blue-glow)' : 'transparent',
        color: active ? 'var(--color-blue)' : disabled ? 'var(--color-subtle)' : 'var(--color-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function FilterIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
}

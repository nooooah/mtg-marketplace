'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

interface ScryfallCard {
  id: string
  name: string
  set_name: string
  set: string
  rarity: string
  image_uris?: { small: string }
  card_faces?: { image_uris?: { small: string } }[]
}

export default function HomeSearchBar() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<ScryfallCard[]>([])
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const debouncedQuery = useDebounce(value, 260)
  const showDropdown = focused && (suggestions.length > 0 || loading) && value.trim().length > 1

  // Fetch Scryfall suggestions
  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 2) { setSuggestions([]); setLoading(false); return }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=name&unique=cards&page=1`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        setSuggestions(data.data ? (data.data as ScryfallCard[]).slice(0, 6) : [])
        setLoading(false)
      })
      .catch(() => { setLoading(false) })
  }, [debouncedQuery])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false); setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const commit = useCallback((card: ScryfallCard) => {
    setValue(card.name)
    setSuggestions([])
    setFocused(false)
    setActiveIdx(-1)
    router.push(`/buy?q=${encodeURIComponent(card.name)}`)
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeIdx >= 0 && suggestions[activeIdx]) { commit(suggestions[activeIdx]); return }
    const q = value.trim()
    if (q) { setSuggestions([]); setFocused(false); router.push(`/buy?q=${encodeURIComponent(q)}`) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    if (e.key === 'Escape')    { setFocused(false); setActiveIdx(-1) }
    if (e.key === 'Enter' && activeIdx >= 0 && suggestions[activeIdx]) {
      e.preventDefault(); commit(suggestions[activeIdx])
    }
  }

  function cardImg(card: ScryfallCard) {
    return card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small ?? null
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--color-surface)',
          border: `1px solid ${focused ? 'var(--color-blue)' : 'var(--color-border)'}`,
          borderRadius: showDropdown ? '12px 12px 0 0' : '12px',
          overflow: 'hidden',
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.15)' : '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}>
          {loading ? <SpinnerIcon /> : <SearchIcon />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { setValue(e.target.value); setActiveIdx(-1) }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a card — Lightning Bolt, Black Lotus…"
          autoComplete="off"
          style={{
            flex: 1, background: 'transparent', border: 'none', borderRadius: 0,
            padding: '14px 0', fontSize: '15px', color: 'var(--color-text)',
            outline: 'none', width: '100%',
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => { setValue(''); setSuggestions([]); inputRef.current?.focus() }}
            style={{ padding: '0 10px', background: 'transparent', border: 'none', color: 'var(--color-subtle)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <XIcon />
          </button>
        )}
        <button
          type="submit"
          style={{
            margin: '6px', padding: '8px 18px', borderRadius: '8px',
            background: 'var(--color-blue)', color: '#fff',
            border: 'none', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-blue-dim)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-blue)')}
        >
          Search
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-blue)',
          borderTop: '1px solid var(--color-border)',
          borderRadius: '0 0 12px 12px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
          overflow: 'hidden',
        }}>
          {suggestions.map((card, i) => {
            const img = cardImg(card)
            const isActive = i === activeIdx
            return (
              <button
                key={card.id}
                type="button"
                onMouseDown={() => commit(card)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  width: '100%', padding: '10px 16px', textAlign: 'left',
                  background: isActive ? 'var(--color-surface-2)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.1s ease',
                }}
              >
                {img
                  ? <img src={img} alt="" style={{ width: '32px', height: '45px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: '32px', height: '45px', borderRadius: '4px', background: 'var(--color-surface-2)', flexShrink: 0 }} />
                }
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className={`ss ss-${card.set.toLowerCase()} ss-${card.rarity.toLowerCase()} ss-grad`} style={{ fontSize: '13px', flexShrink: 0 }} />
                    {card.set_name} · {card.set.toUpperCase()}
                  </span>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-blue)', fontWeight: 600, flexShrink: 0 }}>
                  Search →
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

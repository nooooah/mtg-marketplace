'use client'

import { useState, useEffect, useRef } from 'react'
import type { ScryfallCard } from '@/types'
import { useCardHover, HoverCardImage } from '@/components/CardHoverPreview'

/* ─── Constants ────────────────────────────────────────────── */

const MULTIPLIERS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80] as const

/* ─── Helpers ──────────────────────────────────────────────── */

function getCardImage(card: ScryfallCard): string | null {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('en-PH')
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function PriceCheckerPage() {
  // Card search
  const [cardQuery, setCardQuery]             = useState('')
  const [searchResults, setSearchResults]     = useState<ScryfallCard[]>([])
  const [selectedCard, setSelectedCard]       = useState<ScryfallCard | null>(null)
  const [isFoil, setIsFoil]                   = useState(false)

  // Printings panel
  const [showPrintings, setShowPrintings]     = useState(false)
  const [printingResults, setPrintingResults] = useState<ScryfallCard[]>([])
  const [printingsLoading, setPrintingsLoading] = useState(false)

  // Exchange rate (informational only)
  const [phpRate, setPhpRate]                 = useState<number | null>(null)
  const [rateLoading, setRateLoading]         = useState(false)

  // Multiplier selection — default to ×50
  const [activeMult, setActiveMult]           = useState<number | 'custom' | null>(50)
  const [customMult, setCustomMult]           = useState('')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch exchange rate once — shown as informational reference only
  useEffect(() => {
    setRateLoading(true)
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => setPhpRate(data?.rates?.PHP ?? null))
      .catch(() => setPhpRate(null))
      .finally(() => setRateLoading(false))
  }, [])

  // Debounced Scryfall search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!cardQuery.trim() || selectedCard) { setSearchResults([]); return }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardQuery)}&unique=prints&order=name&limit=20`)
        const data = await res.json()
        setSearchResults(res.ok ? (data.data ?? []) : [])
      } catch { setSearchResults([]) }
    }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [cardQuery, selectedCard])

  const selectCard = (card: ScryfallCard) => {
    setSelectedCard(card)
    setCardQuery(card.name)
    setSearchResults([])
    setShowPrintings(false)
    setPrintingResults([])
    setActiveMult(50)
    setCustomMult('')
    setIsFoil(false)
  }

  const clearCard = () => {
    setSelectedCard(null)
    setCardQuery('')
    setSearchResults([])
    setShowPrintings(false)
    setPrintingResults([])
    setActiveMult(50)
    setCustomMult('')
    setIsFoil(false)
  }

  const fetchPrintings = async (name: string) => {
    setPrintingsLoading(true)
    try {
      const res = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(name)}"&unique=prints&order=released`)
      const data = await res.json()
      setPrintingResults(res.ok ? (data.data ?? []) : [])
    } catch { setPrintingResults([]) }
    setPrintingsLoading(false)
  }

  const togglePrintings = () => {
    if (showPrintings) { setShowPrintings(false); return }
    setShowPrintings(true)
    if (selectedCard && printingResults.length === 0) fetchPrintings(selectedCard.name)
  }

  // Derived prices
  const usdPrice = selectedCard
    ? parseFloat((isFoil
        ? (selectedCard.prices?.usd_foil ?? selectedCard.prices?.usd)
        : selectedCard.prices?.usd) ?? '0') || null
    : null

  // PHP at spot rate (informational)
  const phpSpot = usdPrice && phpRate ? usdPrice * phpRate : null

  // Multiplier result: USD × multiplier only (multiplier replaces the rate)
  const activeMult_num = activeMult === 'custom'
    ? (parseFloat(customMult) || null)
    : activeMult

  const resultPrice = usdPrice && activeMult_num
    ? usdPrice * activeMult_num
    : null

  const imgUrl = selectedCard ? getCardImage(selectedCard) : null

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 1.25rem 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: "'Beleren2016', serif",
          fontSize: '28px', fontWeight: 700,
          color: 'var(--color-text)',
          letterSpacing: '-0.02em', margin: '0 0 6px',
        }}>
          Price Checker
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
          Look up TCGPlayer prices and calculate local PHP values at any multiplier.
        </p>
      </div>

      {/* ── Card Search ─────────────────────────────────────── */}
      <Section label="Find your card">
        {selectedCard ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Selected card row */}
            <div style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              background: 'var(--color-surface-2)', borderRadius: '10px', padding: '12px',
            }}>
              {imgUrl && (
                <HoverCardImage
                  src={imgUrl}
                  alt={selectedCard.name}
                  style={{ width: '56px', borderRadius: '6px', flexShrink: 0, cursor: 'default' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', margin: '0 0 3px' }}>
                  {selectedCard.name}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className={`ss ss-${selectedCard.set.toLowerCase()} ss-${selectedCard.rarity.toLowerCase()} ss-grad`} style={{ fontSize: '14px' }} />
                  {selectedCard.set_name} · {selectedCard.set.toUpperCase()} #{selectedCard.collector_number}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-subtle)', margin: 0, textTransform: 'capitalize' }}>
                  {selectedCard.rarity} · {selectedCard.type_line}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={clearCard} style={ghostBtn}>Change card</button>
              <button
                onClick={togglePrintings}
                style={{ ...ghostBtn, color: showPrintings ? 'var(--color-blue)' : undefined, borderColor: showPrintings ? 'var(--color-blue)' : undefined }}
              >
                {printingsLoading ? 'Loading…' : 'Change printing'}
              </button>

              {/* Foil toggle */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                cursor: 'pointer', marginLeft: 'auto',
                fontSize: '13px', color: isFoil ? '#fbbf24' : 'var(--color-muted)',
                fontWeight: isFoil ? 600 : 400,
              }}>
                <span style={{
                  width: '32px', height: '18px', borderRadius: '9px', flexShrink: 0,
                  background: isFoil ? '#fbbf24' : 'var(--color-border)',
                  position: 'relative', transition: 'background 0.2s ease',
                }}>
                  <span style={{
                    position: 'absolute', top: '2px',
                    left: isFoil ? '16px' : '2px',
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s ease',
                  }} />
                </span>
                <input type="checkbox" checked={isFoil} onChange={e => setIsFoil(e.target.checked)} style={{ display: 'none' }} />
                ✦ Foil
              </label>
            </div>

            {/* Printings list */}
            {showPrintings && (
              <div style={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px', overflow: 'hidden',
                maxHeight: '240px', overflowY: 'auto',
              }}>
                {printingsLoading
                  ? <p style={{ fontSize: '13px', color: 'var(--color-subtle)', padding: '14px', margin: 0, fontStyle: 'italic' }}>Loading printings…</p>
                  : printingResults.length === 0
                    ? <p style={{ fontSize: '13px', color: 'var(--color-subtle)', padding: '14px', margin: 0 }}>No other printings found.</p>
                    : printingResults.map(card => (
                        <ScryfallRow key={card.id} card={card} onSelect={c => { selectCard(c); setShowPrintings(false) }} />
                      ))
                }
              </div>
            )}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtle)', pointerEvents: 'none' }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search by card name…"
                value={cardQuery}
                onChange={e => setCardQuery(e.target.value)}
                autoFocus
                style={{ paddingLeft: '38px', paddingRight: '12px' }}
              />
            </div>
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: '10px', overflow: 'hidden',
                maxHeight: '280px', overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}>
                {searchResults.map(card => <ScryfallRow key={card.id} card={card} onSelect={selectCard} />)}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Price Display ────────────────────────────────────── */}
      {selectedCard && (
        <Section label="Current price">
          {usdPrice ? (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* USD */}
              <PricePill
                label={`TCGPlayer${isFoil ? ' (foil)' : ''}`}
                value={`$${usdPrice.toFixed(2)}`}
                sub="USD"
                color="#10b981"
              />
              {/* PHP spot — informational */}
              {phpSpot && (
                <PricePill
                  label={rateLoading ? 'Fetching rate…' : `Spot rate ₱${phpRate?.toFixed(2)} / $1`}
                  value={`₱${fmt(phpSpot)}`}
                  sub="PHP at spot rate"
                  color="var(--color-blue)"
                />
              )}
              {!phpRate && !rateLoading && (
                <p style={{ fontSize: '12px', color: '#f87171', margin: 0, alignSelf: 'center' }}>
                  Could not fetch exchange rate.
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--color-subtle)', margin: 0, fontStyle: 'italic' }}>
              No {isFoil ? 'foil ' : ''}price data available for this printing.
            </p>
          )}
        </Section>
      )}

      {/* ── Multiplier Grid ──────────────────────────────────── */}
      {selectedCard && usdPrice && (
        <Section label="Multiplier calculator">
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Pick a multiplier — result is <strong>USD price × multiplier</strong>, shown in PHP.
          </p>

          {/* Result display */}
          {resultPrice && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(124,58,237,0.08))',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: '14px', padding: '20px 24px',
              textAlign: 'center', marginBottom: '16px',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {activeMult === 'custom' ? `×${customMult || '?'}` : `×${activeMult}`} · {selectedCard.name}{isFoil ? ' (Foil)' : ''}
              </p>
              <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em', fontFamily: "'Beleren2016', serif" }}>
                ₱{fmt(resultPrice)}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-subtle)', margin: '4px 0 0' }}>
                ${usdPrice.toFixed(2)} × {activeMult === 'custom' ? (customMult || '?') : activeMult}
              </p>
            </div>
          )}

          {/* Multiplier buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
            gap: '8px',
          }}>
            {MULTIPLIERS.map(m => {
              const price = usdPrice * m
              const isActive = activeMult === m
              return (
                <button
                  key={m}
                  onClick={() => { setActiveMult(isActive ? null : m); setCustomMult('') }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '2px', padding: '10px 6px', borderRadius: '10px',
                    border: `1px solid ${isActive ? 'var(--color-blue)' : 'var(--color-border)'}`,
                    background: isActive ? 'rgba(59,130,246,0.12)' : 'var(--color-surface)',
                    color: isActive ? 'var(--color-blue)' : 'var(--color-text)',
                    cursor: 'pointer', transition: 'all 0.12s ease',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <span style={{ fontSize: '13px' }}>×{m}</span>
                  <span style={{ fontSize: '10px', color: isActive ? 'var(--color-blue)' : 'var(--color-subtle)', fontWeight: 400 }}>
                    ₱{fmt(price)}
                  </span>
                </button>
              )
            })}

            {/* Custom button */}
            <button
              onClick={() => setActiveMult(activeMult === 'custom' ? null : 'custom')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '2px', padding: '10px 6px', borderRadius: '10px',
                border: `1px solid ${activeMult === 'custom' ? 'var(--color-blue)' : 'var(--color-border)'}`,
                background: activeMult === 'custom' ? 'rgba(59,130,246,0.12)' : 'var(--color-surface)',
                color: activeMult === 'custom' ? 'var(--color-blue)' : 'var(--color-muted)',
                cursor: 'pointer', transition: 'all 0.12s ease',
                fontWeight: activeMult === 'custom' ? 700 : 500,
              }}
            >
              <span style={{ fontSize: '13px' }}>Custom</span>
              <span style={{ fontSize: '10px', color: 'var(--color-subtle)', fontWeight: 400 }}>×?</span>
            </button>
          </div>

          {/* Custom input */}
          {activeMult === 'custom' && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>Custom multiplier:</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 90"
                value={customMult}
                onChange={e => setCustomMult(e.target.value)}
                autoFocus
                style={{ width: '100px' }}
              />
              {customMult && usdPrice && (
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                  = ₱{fmt(usdPrice * parseFloat(customMult))}
                </span>
              )}
            </div>
          )}
        </Section>
      )}

    </div>
  )
}

/* ─── Sub-components ───────────────────────────────────────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '16px', padding: '20px 22px',
      marginBottom: '16px',
    }}>
      <p style={{
        fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        margin: '0 0 14px',
      }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function PricePill({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      flex: 1, minWidth: '140px',
      background: `${color}0d`, border: `1px solid ${color}30`,
      borderRadius: '12px', padding: '14px 18px',
    }}>
      <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: '0 0 4px', fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 800, color, margin: '0 0 2px', letterSpacing: '-0.02em', fontFamily: "'Beleren2016', serif" }}>
        {value}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--color-subtle)', margin: 0 }}>{sub}</p>
    </div>
  )
}

function ScryfallRow({ card, onSelect }: { card: ScryfallCard; onSelect: (c: ScryfallCard) => void }) {
  const [hov, setHov] = useState(false)
  const img = getCardImage(card)
  const usd = card.prices?.usd_foil ?? card.prices?.usd
  const { onMouseMove, onMouseLeave: onPreviewLeave, preview } = useCardHover(img)

  return (
    <button
      onClick={() => onSelect(card)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); onPreviewLeave() }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', padding: '8px 12px', border: 'none',
        background: hov ? 'var(--color-surface-2)' : 'transparent',
        textAlign: 'left', cursor: 'pointer', transition: 'background 0.1s ease',
      }}
    >
      {preview}
      {img
        ? <img src={img} alt={card.name} onMouseMove={onMouseMove} style={{ width: '32px', height: '44px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
        : <div style={{ width: '32px', height: '44px', borderRadius: '4px', background: 'var(--color-surface-2)', flexShrink: 0 }} />
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {card.name}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className={`ss ss-${card.set.toLowerCase()} ss-${card.rarity.toLowerCase()} ss-grad`} style={{ fontSize: '12px' }} />
          {card.set_name} · #{card.collector_number}
        </p>
      </div>
      {usd && (
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', flexShrink: 0 }}>${usd}</span>
      )}
    </button>
  )
}

/* ─── Styles ───────────────────────────────────────────────── */

const ghostBtn: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
  border: '1px solid var(--color-border)', background: 'transparent',
  color: 'var(--color-muted)', cursor: 'pointer', transition: 'all 0.12s ease',
}

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}

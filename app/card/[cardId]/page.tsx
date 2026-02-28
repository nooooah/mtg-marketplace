import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CardListingsSection from './CardListingsSection'
import type { Listing } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RARITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  common:   { color: '#94a3b8', bg: '#94a3b815', border: '#94a3b840' },
  uncommon: { color: '#a8b5c8', bg: '#a8b5c815', border: '#a8b5c840' },
  rare:     { color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b40' },
  mythic:   { color: '#f97316', bg: '#f9731615', border: '#f9731640' },
  special:  { color: '#a855f7', bg: '#a855f715', border: '#a855f740' },
  bonus:    { color: '#a855f7', bg: '#a855f715', border: '#a855f740' },
}

const FORMAT_LABELS: Record<string, string> = {
  standard: 'Standard', pioneer: 'Pioneer', modern: 'Modern',
  legacy: 'Legacy', vintage: 'Vintage', commander: 'Commander',
  pauper: 'Pauper', historic: 'Historic', brawl: 'Brawl', alchemy: 'Alchemy',
}

const MANA_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  W: { bg: '#f5f0e0', color: '#92742a', border: '#d4a82050' },
  U: { bg: '#1a3a6e', color: '#93c5fd', border: '#3b82f650' },
  B: { bg: '#1a1a2e', color: '#c084fc', border: '#7c3aed50' },
  R: { bg: '#5a1a1a', color: '#fca5a5', border: '#dc262650' },
  G: { bg: '#1a3a2e', color: '#86efac', border: '#16a34a50' },
  C: { bg: '#2a2a3a', color: '#94a3b8', border: '#47556950' },
}

function parseMana(cost: string | null): Array<{ symbol: string; type: string }> {
  if (!cost) return []
  const matches = cost.match(/\{[^}]+\}/g) ?? []
  return matches.map(m => {
    const inner = m.slice(1, -1)
    const type = ['W', 'U', 'B', 'R', 'G', 'C'].includes(inner) ? inner : 'generic'
    return { symbol: inner, type }
  })
}

function ManaCost({ cost }: { cost: string | null }) {
  const symbols = parseMana(cost)
  if (!symbols.length) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
      {symbols.map((s, i) => {
        const style = MANA_COLORS[s.type] ?? { bg: 'var(--color-surface-2)', color: 'var(--color-muted)', border: 'var(--color-border)' }
        return (
          <span
            key={i}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '22px', height: '22px', borderRadius: '50%',
              fontSize: '10px', fontWeight: 800, letterSpacing: 0,
              background: style.bg, color: style.color,
              border: `1.5px solid ${style.border}`,
              flexShrink: 0,
            }}
          >
            {s.symbol}
          </span>
        )
      })}
    </div>
  )
}

function OracleText({ text }: { text: string }) {
  // Split by reminder text in parens and paragraph breaks
  const paragraphs = text.split('\n').filter(Boolean)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {paragraphs.map((p, i) => (
        <p key={i} style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.65, margin: 0 }}>
          {p}
        </p>
      ))}
    </div>
  )
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchScryfallCard(cardId: string) {
  try {
    const res = await fetch(`https://api.scryfall.com/cards/${cardId}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchPrintings(oracleId: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?order=released&dir=desc&q=oracleid%3A${oracleId}&unique=prints`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).slice(0, 12)
  } catch {
    return []
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params
  const supabase = await createClient()

  const [card, listingsRes] = await Promise.all([
    fetchScryfallCard(cardId),
    supabase
      .from('listings')
      .select('*, profiles(id, username, avatar_url, display_name, created_at, messenger_link)')
      .eq('card_id', cardId)
      .gt('quantity', 0)
      .order('price', { ascending: true }),
  ])

  if (!card) notFound()

  const listings = (listingsRes.data ?? []) as Listing[]
  const printings = card.oracle_id ? await fetchPrintings(card.oracle_id) : []

  // Card image (handle double-faced cards)
  const imageUrl = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal
  const imageBack = card.card_faces?.[1]?.image_uris?.normal

  // Legalities
  const legalities: Record<string, string> = card.legalities ?? {}
  const mainFormats = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper', 'historic', 'brawl']
  const legalFormats = mainFormats.filter(f => legalities[f] === 'legal')
  const illegalFormats = mainFormats.filter(f => legalities[f] && legalities[f] !== 'legal')

  // Scryfall reference prices
  const refUsd = card.prices?.usd ? `$${card.prices.usd}` : null
  const refFoil = card.prices?.usd_foil ? `$${card.prices.usd_foil}` : null

  const rarityStyle = RARITY_STYLE[card.rarity] ?? RARITY_STYLE.common

  const lowestListing = listings[0]
  const lowestPrice = lowestListing?.price

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 1.5rem 80px' }}>

      {/* Back */}
      <Link
        href="/buy"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', marginBottom: '28px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        Back to listings
      </Link>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '48px', alignItems: 'start' }}>

        {/* ── LEFT COLUMN ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'sticky', top: '80px' }}>

          {/* Card image */}
          <div style={{
            borderRadius: '18px', overflow: 'hidden',
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          }}>
            {imageUrl ? (
              <img src={imageUrl} alt={card.name} style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ aspectRatio: '3/4', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--color-subtle)', fontSize: '13px' }}>No image</span>
              </div>
            )}
          </div>

          {/* Back face (double-faced cards) */}
          {imageBack && (
            <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <img src={imageBack} alt={`${card.name} (back)`} style={{ width: '100%', display: 'block' }} />
            </div>
          )}

          {/* Reference prices from Scryfall */}
          {(refUsd || refFoil) && (
            <div style={{
              padding: '16px', background: 'var(--color-surface)',
              border: '1px solid var(--color-border)', borderRadius: '12px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                Scryfall Reference Prices
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {refUsd && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Non-Foil NM</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{refUsd}</span>
                  </div>
                )}
                {refFoil && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#fbbf24' }}>✦ Foil NM</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>{refFoil}</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: '10px', color: 'var(--color-subtle)', margin: '12px 0 0', lineHeight: 1.5 }}>
                USD prices from Scryfall. Local listings in ₱ (PHP).
              </p>
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Header: name, rarity, mana */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'capitalize', padding: '3px 10px', borderRadius: '6px',
                color: rarityStyle.color, background: rarityStyle.bg, border: `1px solid ${rarityStyle.border}`,
              }}>
                {card.rarity}
              </span>
              <ManaCost cost={card.mana_cost} />
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.1 }}>
              {card.name}
            </h1>

            <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: '0 0 4px' }}>
              {card.set_name}
              <span style={{ color: 'var(--color-subtle)' }}> · {card.set?.toUpperCase()} #{card.collector_number}</span>
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-subtle)', margin: 0, fontStyle: 'italic' }}>
              {card.type_line}
            </p>
          </div>

          {/* Lowest marketplace price + CTA */}
          {lowestPrice != null && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', background: 'var(--color-surface)',
              border: '1px solid var(--color-border)', borderRadius: '14px', flexWrap: 'wrap', gap: '12px',
            }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  From our community
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                    ₱{lowestPrice.toLocaleString('en-PH')}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>lowest · {listings.length} seller{listings.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <a
                href="#listings"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 22px', background: 'var(--color-blue)',
                  color: '#fff', borderRadius: '10px', fontSize: '14px',
                  fontWeight: 600, textDecoration: 'none',
                }}
              >
                See all sellers ↓
              </a>
            </div>
          )}

          {/* Oracle text */}
          {card.oracle_text && (
            <div style={{
              padding: '18px 20px', background: 'var(--color-surface)',
              border: '1px solid var(--color-border)', borderRadius: '14px',
            }}>
              <OracleText text={card.oracle_text} />
              {card.flavor_text && (
                <p style={{
                  fontSize: '13px', color: 'var(--color-subtle)', fontStyle: 'italic',
                  margin: '12px 0 0', paddingTop: '12px', borderTop: '1px solid var(--color-border)', lineHeight: 1.6,
                }}>
                  {card.flavor_text}
                </p>
              )}
            </div>
          )}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Colors', value: card.colors?.length ? card.colors.join(', ') : 'Colorless' },
              { label: 'CMC', value: card.cmc ?? '—' },
              { label: 'Collector #', value: `#${card.collector_number}` },
              { label: 'Released', value: card.released_at ?? '—' },
              { label: 'Set', value: card.set?.toUpperCase() ?? '—' },
              ...(card.power != null ? [{ label: 'Power / Toughness', value: `${card.power} / ${card.toughness}` }] : []),
              ...(card.loyalty != null ? [{ label: 'Loyalty', value: card.loyalty }] : []),
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: '12px 14px', background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)', borderRadius: '10px',
                }}
              >
                <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
                  {label}
                </p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Format Legality */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
              Format Legality
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px' }}>
              {legalFormats.map(f => (
                <div key={f} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 500 }}>{FORMAT_LABELS[f]}</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#22c55e',
                    background: '#22c55e15', border: '1px solid #22c55e35',
                    padding: '2px 7px', borderRadius: '5px',
                  }}>Legal</span>
                </div>
              ))}
              {illegalFormats.map(f => (
                <div key={f} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  opacity: 0.6,
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 500 }}>{FORMAT_LABELS[f]}</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#94a3b8',
                    background: '#94a3b815', border: '1px solid #94a3b835',
                    padding: '2px 7px', borderRadius: '5px',
                  }}>
                    {legalities[f] === 'banned' ? 'Banned' : legalities[f] === 'restricted' ? 'Restricted' : 'Not Legal'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Available from Sellers */}
          <div id="listings">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Available from Sellers
              </p>
              <span style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--color-blue)',
                background: 'var(--color-blue-glow)', border: '1px solid var(--color-blue)40',
                padding: '2px 8px', borderRadius: '5px',
              }}>
                {listings.length} listing{listings.length !== 1 ? 's' : ''}
              </span>
              <Link
                href="/sell"
                style={{
                  marginLeft: 'auto', fontSize: '12px', fontWeight: 600,
                  color: 'var(--color-muted)', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                + Sell this card
              </Link>
            </div>
            <CardListingsSection listings={listings} cardId={cardId} />
          </div>

          {/* All Printings */}
          {printings.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                All Printings · {printings.length} version{printings.length !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                {printings.map((p: any) => {
                  const pImg = p.image_uris?.small ?? p.card_faces?.[0]?.image_uris?.small
                  const isCurrent = p.id === cardId
                  return (
                    <Link key={p.id} href={`/card/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        borderRadius: '10px', overflow: 'hidden',
                        border: `1.5px solid ${isCurrent ? 'var(--color-blue)' : 'var(--color-border)'}`,
                        background: isCurrent ? 'var(--color-blue-glow)' : 'var(--color-surface)',
                        transition: 'border-color 0.15s ease, transform 0.15s ease',
                        display: 'flex', flexDirection: 'column',
                      }}>
                        {pImg && <img src={pImg} alt={p.set_name} style={{ width: '100%', display: 'block' }} />}
                        <div style={{ padding: '6px 8px' }}>
                          <p style={{
                            fontSize: '10px', fontWeight: 600,
                            color: isCurrent ? 'var(--color-blue)' : 'var(--color-text)',
                            margin: '0 0 2px', lineHeight: 1.3,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {p.set_name}
                          </p>
                          <p style={{ fontSize: '9px', color: 'var(--color-muted)', margin: 0 }}>
                            #{p.collector_number} · {p.set?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

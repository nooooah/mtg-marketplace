'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Listing } from '@/types'
import { useCardHover } from './CardHoverPreview'

const CONDITION_LABELS: Record<string, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
}

interface CardTileProps {
  listing: Listing
  onClick?: () => void
  noPreview?: boolean
  compact?: boolean
  href?: string
  sellerCount?: number
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

export default function CardTile({ listing, noPreview = false, compact = false, href, sellerCount = 1 }: CardTileProps) {
  const [imgError, setImgError] = useState(false)
  const [hovering, setHovering] = useState(false)

  const condition = listing.condition
  const imageUrl = listing.card_image_uri
  const sellerInitial = listing.profiles?.username?.[0]?.toUpperCase() ?? '?'

  const { onMouseMove, onMouseLeave: onPreviewLeave, preview } = useCardHover(
    imageUrl && !imgError ? imageUrl : null,
    !noPreview,
  )

  return (
    <Link
      href={href ?? `/listing/${listing.id}`}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: `1px solid ${hovering ? 'var(--color-border-2)' : 'var(--color-border)'}`,
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'border-color 0.15s ease, transform 0.15s ease',
          transform: hovering ? 'translateY(-2px)' : 'translateY(0)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Card image */}
        <div
          onMouseMove={onMouseMove}
          onMouseLeave={onPreviewLeave}
          style={{
            position: 'relative',
            aspectRatio: '3/4',
            background: 'var(--color-surface-2)',
            overflow: 'hidden',
          }}
        >
          {preview}
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={listing.card_name}
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.2s ease',
                transform: hovering ? 'scale(1.03)' : 'scale(1)',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-subtle)',
                fontSize: '12px',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <MtgIcon />
              <span>{listing.card_name}</span>
            </div>
          )}

          {/* Not available overlay */}
          {listing.quantity === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                color: '#fff', background: 'rgba(0,0,0,0.7)',
                padding: '5px 10px', borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.15)',
                textAlign: 'center', lineHeight: 1.3,
              }}>
                Currently Not Available
              </span>
            </div>
          )}

          {/* Bottom overlay: foil badge only */}
          {listing.is_foil && (
            <div style={{
              position: 'absolute', bottom: '8px', left: '8px',
              pointerEvents: 'none',
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em',
                color: '#fbbf24', background: 'rgba(0,0,0,0.75)',
                padding: '2px 5px', borderRadius: '4px',
                border: '1px solid rgba(234,179,8,0.4)',
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth={1}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> FOIL
              </span>
            </div>
          )}
        </div>

        {/* Card details */}
        <div style={{ padding: compact ? '8px 10px' : '12px', display: 'flex', flexDirection: 'column', gap: compact ? '3px' : '4px', flex: 1 }}>
          {/* Name */}
          <p style={{
            fontWeight: 600,
            fontSize: compact ? '12px' : '13px',
            color: 'var(--color-text)',
            margin: 0,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {listing.card_name}
          </p>

          {/* Set name */}
          {listing.card_set_name && (
            <p style={{
              fontSize: compact ? '10px' : '11px',
              color: 'var(--color-muted)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              {listing.card_set && (
                <i
                  className={`ss ss-${listing.card_set.toLowerCase()} ss-${(listing.card_rarity ?? 'common').toLowerCase()} ss-grad`}
                  style={{ fontSize: compact ? '12px' : '14px', flexShrink: 0 }}
                />
              )}
              {listing.card_set_name}
            </p>
          )}

          {/* Sold by — hidden in compact */}
          {!compact && (
            <p style={{
              fontSize: '11px', color: 'var(--color-subtle)',
              margin: 0, marginTop: '1px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {sellerCount > 1 ? (
                <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>
                  {sellerCount} sellers
                </span>
              ) : (
                <>Sold by <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>
                  {listing.profiles?.username ?? 'Seller'}
                </span></>
              )}
            </p>
          )}

          {/* Footer rows */}
          <div style={{
            marginTop: 'auto',
            paddingTop: compact ? '6px' : '8px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex', flexDirection: 'column', gap: '3px',
          }}>
            {/* Row 1: price + condition */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: compact ? '13px' : '15px',
                  color: 'var(--color-text)',
                  flexShrink: 0,
                }}>
                  ₱{listing.price.toLocaleString('en-PH')}
                </span>
                {listing.usd_price && listing.usd_price > 0 && (() => {
                  const mult = Math.round(listing.price / listing.usd_price)
                  let bucket: number | null = null
                  let color = 'var(--color-subtle)'
                  if (mult <= 30)      { bucket = 30; color = '#10b981' }
                  else if (mult <= 40) { bucket = 40; color = '#22c55e' }
                  else if (mult <= 50) { bucket = 50; color = '#3b82f6' }
                  else if (mult <= 60) { bucket = 60; color = 'var(--color-subtle)' }
                  else if (mult <= 70) { bucket = 70; color = '#f97316' }
                  if (!bucket) return null
                  return (
                    <span style={{
                      fontSize: '9px', fontWeight: 700,
                      color, border: `1px solid ${color}40`,
                      background: `${color}12`,
                      borderRadius: '4px', padding: '1px 4px',
                      flexShrink: 0, letterSpacing: '0.01em',
                    }}>
                      ×{bucket}
                    </span>
                  )
                })()}
              </div>
              <span className={`badge badge-${listing.condition.toLowerCase()}`} style={{ fontSize: compact ? '9px' : undefined, flexShrink: 0 }}>
                {listing.condition}
              </span>
            </div>

            {/* Row 2: quantity + days ago */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: compact ? '9px' : '10px',
                color: listing.quantity === 0 ? '#ef4444' : listing.quantity === 1 ? '#f97316' : 'var(--color-subtle)',
                fontWeight: listing.quantity <= 1 ? 600 : 400,
              }}>
                {listing.quantity === 0 ? 'No Stock' : listing.quantity === 1 ? 'Last one' : `${listing.quantity} available`}
              </span>
              <span style={{ fontSize: compact ? '9px' : '10px', color: 'var(--color-subtle)' }}>
                {daysAgo(listing.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function MessageButton({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.location.href = `/messages/new?listing=${listingId}&to=${sellerId}`
  }

  return (
    <button
      onClick={handleClick}
      title="Message seller"
      style={{
        width: '26px',
        height: '26px',
        borderRadius: '7px',
        border: '1px solid var(--color-border)',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-muted)',
        flexShrink: 0,
        transition: 'all 0.15s ease',
        padding: 0,
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
      <MessageIcon size={13} />
    </button>
  )
}

function MessageIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function MtgIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.3}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  )
}

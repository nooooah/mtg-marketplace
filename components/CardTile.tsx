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
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

export default function CardTile({ listing, noPreview = false, compact = false, href }: CardTileProps) {
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

          {/* Bottom overlay: foil left, condition right */}
          <div style={{
            position: 'absolute', bottom: '8px', left: '8px', right: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            pointerEvents: 'none',
          }}>
            {listing.is_foil ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em',
                color: '#fbbf24', background: 'rgba(0,0,0,0.75)',
                padding: '2px 5px', borderRadius: '4px',
                border: '1px solid rgba(234,179,8,0.4)',
              }}>
                ✦ FOIL
              </span>
            ) : <span />}
            <span className={`badge badge-${condition.toLowerCase()}`}>
              {condition}
            </span>
          </div>
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
            }}>
              {listing.card_set_name}
            </p>
          )}

          {/* Seller name — hidden in compact */}
          {!compact && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'var(--color-blue)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {sellerInitial}
              </div>
              <span style={{
                fontSize: '11px', color: 'var(--color-subtle)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {listing.profiles?.username ?? 'Seller'}
              </span>
            </div>
          )}

          {/* Footer: price left, qty + age right */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: compact ? '6px' : '8px',
            borderTop: '1px solid var(--color-border)',
          }}>
            <span style={{
              fontWeight: 700,
              fontSize: compact ? '13px' : '15px',
              color: 'var(--color-text)',
            }}>
              ₱{listing.price.toLocaleString('en-PH')}
            </span>

            <span style={{
              fontSize: compact ? '9px' : '10px',
              color: 'var(--color-subtle)',
              textAlign: 'right',
              lineHeight: 1.4,
            }}>
              ×{listing.quantity} · {daysAgo(listing.created_at)}
            </span>
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

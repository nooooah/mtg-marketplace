'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Event } from '@/types'
import { formatDate } from '@/lib/utils'

// Placeholder events for when no DB data is available
const PLACEHOLDER_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Friday Night Magic — Draft Night',
    description: 'Join us every Friday for booster draft! Open to all skill levels.',
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    location: 'Local Game Store · Downtown',
    image_url: null,
    organizer_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Regional Championship Qualifier',
    description: 'Compete for a spot at the Regional Championship. Standard format.',
    date: new Date(Date.now() + 86400000 * 7).toISOString(),
    location: 'Convention Center · Hall B',
    image_url: null,
    organizer_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Commander Night — Open Duel',
    description: '100-card singleton. Bring your best Commander deck and challenge the community.',
    date: new Date(Date.now() + 86400000 * 14).toISOString(),
    location: 'TCG Hub · Game Room',
    image_url: null,
    organizer_id: null,
    created_at: new Date().toISOString(),
  },
]


interface EventsBannerProps {
  events?: Event[]
}

export default function EventsBanner({ events }: EventsBannerProps) {
  const items = (events && events.length > 0) ? events : PLACEHOLDER_EVENTS
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || items.length <= 1) return
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % items.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [items.length, paused])

  const current = items[active]

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background accent */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', padding: '24px 28px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-blue)',
              }}
            >
              Upcoming Events
            </span>
          </div>
          <Link
            href="/events"
            style={{
              fontSize: '12px',
              color: 'var(--color-muted)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
          >
            See all <ArrowIcon />
          </Link>
        </div>

        {/* Event content */}
        <div
          key={active}
          style={{ animation: 'fadeIn 0.35s ease' }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: '0 0 6px 0',
              lineHeight: 1.3,
            }}
          >
            {current.title}
          </h3>
          {current.description && (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-muted)',
                margin: '0 0 16px 0',
                maxWidth: '600px',
                lineHeight: 1.5,
              }}
            >
              {current.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-muted)' }}>
              <ClockIcon />
              <span>{formatDate(current.date)}</span>
            </div>
            {current.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-muted)' }}>
                <LocationIcon />
                <span>{current.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dots */}
        {items.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginTop: '20px',
            }}
          >
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  width: i === active ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === active ? 'var(--color-blue)' : 'var(--color-border-2)',
                  border: 'none',
                  padding: 0,
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

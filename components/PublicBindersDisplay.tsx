'use client'

import { useState } from 'react'
import ProfileListingsSection from './ProfileListingsSection'
import { ManaIcon, binderTabStyle } from './ManaIcon'
import type { Listing, Binder } from '@/types'

const MASTER_ID = '__master__'

export default function PublicBindersDisplay({
  listings,
  binders,
  displayName,
}: {
  listings: Listing[]
  binders: Binder[]
  displayName: string
}) {
  const binderGroups = binders
    .filter(b => b.show_on_profile !== false)
    .map(b => ({ binder: b, cards: listings.filter(l => l.binder_id === b.id) }))
    .filter(g => g.cards.length > 0)

  const [selectedId, setSelectedId] = useState<string>(MASTER_ID)
  const [masterTooltip, setMasterTooltip] = useState(false)

  const isMasterSelected = selectedId === MASTER_ID
  const activeGroup = isMasterSelected ? null : (binderGroups.find(g => g.binder.id === selectedId) ?? binderGroups[0])
  const activeCards = isMasterSelected ? listings : (activeGroup?.cards ?? [])

  if (listings.length === 0) {
    return (
      <div style={{
        padding: '40px 24px', textAlign: 'center',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '12px', color: 'var(--color-muted)', fontSize: '14px',
        marginBottom: '40px',
      }}>
        No listings yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>

      {/* Binder selector tile */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px 28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          {displayName}'s Binders
        </h2>

        {/* ── Master Binder pill ── */}
        <div style={{ marginBottom: '12px', position: 'relative' }}>
          <button
            onClick={() => setSelectedId(MASTER_ID)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 14px 8px 16px', borderRadius: '10px',
              fontSize: '14px', fontWeight: isMasterSelected ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.12s ease', width: '100%',
              fontFamily: "'Beleren2016', serif",
              background: isMasterSelected ? 'rgba(139,92,246,0.1)' : 'var(--color-surface)',
              border: `1px solid ${isMasterSelected ? '#8B5CF6' : '#6D28D9'}`,
              color: isMasterSelected ? '#c4b5fd' : '#a78bfa',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M2 19h20v2H2v-2zM2 7l5 7 5-7 5 7 5-7v10H2V7z" />
            </svg>
            <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Master Binder</span>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px', flexShrink: 0,
              fontFamily: 'system-ui, sans-serif',
              background: isMasterSelected ? 'rgba(139,92,246,0.15)' : 'var(--color-surface)',
              color: isMasterSelected ? '#c4b5fd' : '#a78bfa',
              border: `1px solid ${isMasterSelected ? 'rgba(139,92,246,0.35)' : '#6D28D9'}`,
            }}>
              {listings.length}
            </span>
            <span
              onMouseEnter={() => setMasterTooltip(true)}
              onMouseLeave={() => setMasterTooltip(false)}
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', color: '#a78bfa', opacity: 0.6, flexShrink: 0, cursor: 'default' }}
            >
              <InfoIcon />
            </span>
          </button>
          {masterTooltip && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 20, marginTop: '6px',
              background: '#1e1b4b', border: '1px solid #4c1d95', borderRadius: '8px',
              padding: '10px 14px', fontSize: '12px', color: '#c4b5fd', lineHeight: 1.5,
              maxWidth: '260px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}>
              Shows all listings from this seller in one place.
            </div>
          )}
        </div>

        <div className="binder-grid">
          {binderGroups.map(({ binder, cards }) => {
            const isActive = binder.id === activeGroup?.binder.id
            return (
              <button
                key={binder.id}
                onClick={() => setSelectedId(binder.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '8px 14px 8px 16px', borderRadius: '10px',
                  fontSize: '14px', fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.12s ease',
                  width: '100%',
                  ...binderTabStyle(binder, isActive),
                }}
              >
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{binder.name}</span>
                {(binder.mana_colors ?? []).map((c, i) => <ManaIcon key={i} color={c} size={15} />)}
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px', flexShrink: 0,
                  background: isActive ? 'rgba(59,130,246,0.15)' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-blue)' : 'var(--color-subtle)',
                  border: `1px solid ${isActive ? 'rgba(59,130,246,0.25)' : 'var(--color-border)'}`,
                }}>
                  {cards.length}
                </span>
              </button>
            )
          })}
        </div>
        {!isMasterSelected && activeGroup?.binder.description && (
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '16px 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>
            {activeGroup.binder.description}
          </p>
        )}
      </div>

      {/* Cards tile */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '28px' }}>
        {activeCards.length > 0
          ? <ProfileListingsSection listings={activeCards} />
          : <p style={{ color: 'var(--color-muted)', fontSize: '14px', margin: 0, textAlign: 'center' }}>No cards in this binder yet.</p>
        }
      </div>

    </div>
  )
}

function InfoIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
}

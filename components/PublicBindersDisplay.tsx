'use client'

import { useState } from 'react'
import ProfileListingsSection from './ProfileListingsSection'
import type { Listing, Binder } from '@/types'

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
    .map(b => ({ binder: b, cards: listings.filter(l => l.binder_id === b.id) }))
    .filter(g => g.cards.length > 0)

  const [selectedId, setSelectedId] = useState<string>(binderGroups[0]?.binder.id ?? '')
  const activeGroup = binderGroups.find(g => g.binder.id === selectedId) ?? binderGroups[0]

  if (binderGroups.length === 0) {
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {binderGroups.map(({ binder, cards }) => {
            const isActive = binder.id === activeGroup?.binder.id
            return (
              <button
                key={binder.id}
                onClick={() => setSelectedId(binder.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '8px 16px', borderRadius: '10px',
                  border: `1px solid ${isActive ? 'var(--color-blue)' : 'var(--color-border)'}`,
                  background: isActive ? 'var(--color-blue-glow)' : 'var(--color-surface-2)',
                  color: isActive ? 'var(--color-blue)' : 'var(--color-muted)',
                  fontSize: '14px', fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {binder.name}
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px',
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
      </div>

      {/* Cards tile */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '28px' }}>
        {activeGroup?.binder.description && (
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 16px', fontStyle: 'italic', lineHeight: 1.5 }}>
            {activeGroup.binder.description}
          </p>
        )}
        {activeGroup && <ProfileListingsSection listings={activeGroup.cards} />}
      </div>

    </div>
  )
}

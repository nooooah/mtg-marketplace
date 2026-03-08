'use client'

import { useState } from 'react'
import ProfileListingsSection from './ProfileListingsSection'
import { ManaIcon, binderTabStyle } from './ManaIcon'
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
    .filter(b => b.show_on_profile !== false) // hide binders owner chose to hide
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
        <div className="binder-grid">
          {binderGroups.map(({ binder, cards }) => {
            const isActive = binder.id === activeGroup?.binder.id
            return (
              <button
                key={binder.id}
                onClick={() => setSelectedId(binder.id)}
                style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  padding: '14px 14px 12px',
                  minHeight: '110px',
                  borderRadius: '12px',
                  fontSize: '14px', fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  textAlign: 'left',
                  ...binderTabStyle(binder, isActive),
                }}
              >
                {/* Binder name */}
                <span style={{ lineHeight: 1.35 }}>{binder.name}</span>

                {/* Bottom row: mana pips + card count */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    {(binder.mana_colors ?? []).map((c, i) => <ManaIcon key={i} color={c} size={16} />)}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px',
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'var(--color-surface)',
                    color: isActive ? 'var(--color-blue)' : 'var(--color-subtle)',
                    border: `1px solid ${isActive ? 'rgba(59,130,246,0.25)' : 'var(--color-border)'}`,
                  }}>
                    {cards.length}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {activeGroup?.binder.description && (
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '16px 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>
            {activeGroup.binder.description}
          </p>
        )}
      </div>

      {/* Cards tile */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '28px' }}>
        {activeGroup && <ProfileListingsSection listings={activeGroup.cards} />}
      </div>

    </div>
  )
}

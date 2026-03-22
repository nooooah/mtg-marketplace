'use client'

import Link from 'next/link'

const PATREON_URL = 'https://www.patreon.com/cw/mtgbinderapp'

/* ── Sample icon sets shown on each card ── */
const SAMPLE_SETS = ['lea', 'znr', 'neo', 'mom', 'eld']

const TIERS = [
  {
    name: 'Uncommon',
    price: '$1',
    rarity: 'uncommon',
    color: '#8c9dc0',
    glow: 'rgba(140,157,192,0.15)',
    border: 'rgba(140,157,192,0.35)',
    description: 'Show your humble contribution to the community with a silver icon badge on your profile.',
    perks: ['Uncommon-rarity profile emblem', 'Choose any MTG set icon', 'Support the marketplace'],
  },
  {
    name: 'Rare',
    price: '$3',
    rarity: 'rare',
    color: '#c5a84e',
    glow: 'rgba(197,168,78,0.15)',
    border: 'rgba(197,168,78,0.35)',
    description: 'Stand out with a gold icon badge and show your significant contribution to mtgbinder.',
    perks: ['Rare-rarity profile emblem', 'Choose any MTG set icon', 'Priority feature feedback'],
    featured: true,
  },
  {
    name: 'Mythic',
    price: '$5',
    rarity: 'mythic',
    color: '#e8834a',
    glow: 'rgba(232,131,74,0.15)',
    border: 'rgba(232,131,74,0.35)',
    description: 'The highest honour — a mythic icon badge marking your outstanding support of the site.',
    perks: ['Mythic-rarity profile emblem', 'Choose any MTG set icon', 'Your name in the credits'],
  },
]

export default function DonatePage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 1.5rem 100px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        {/* Stacked icon preview */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px', marginBottom: '24px' }}>
          {(['uncommon', 'rare', 'mythic'] as const).map(r => (
            <i key={r} className={`ss ss-znr ss-${r} ss-grad`} style={{ fontSize: '36px', lineHeight: 1 }} />
          ))}
        </div>

        <h1 style={{
          fontFamily: "'Beleren2016', serif",
          fontSize: '32px', fontWeight: 700,
          color: 'var(--color-text)', letterSpacing: '-0.02em',
          margin: '0 0 14px',
        }}>
          Support mtgbinder
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.65, maxWidth: '520px', margin: '0 auto 6px' }}>
          mtgbinder is a free, community-built marketplace for Philippine MTG players.
          Supporters get a <strong style={{ color: 'var(--color-text)' }}>keyrune emblem badge</strong> on their profile — a permanent mark of their contribution.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-subtle)', margin: 0 }}>
          Memberships are managed via Patreon. Cancel anytime.
        </p>
      </div>

      {/* Tier cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '48px',
        alignItems: 'start',
      }}>
        {TIERS.map(tier => (
          <TierCard key={tier.name} tier={tier} />
        ))}
      </div>

      {/* How it works */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '14px', padding: '28px 32px', marginBottom: '36px',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 18px', letterSpacing: '-0.01em' }}>
          How it works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
          {[
            { step: '1', label: 'Pick a tier', desc: 'Choose Uncommon, Rare, or Mythic on Patreon.' },
            { step: '2', label: 'Message us', desc: 'Send your mtgbinder username to our Patreon page.' },
            { step: '3', label: 'Choose your icon', desc: 'Tell us which MTG set icon you want on your profile.' },
            { step: '4', label: 'Badge appears', desc: 'We assign your emblem and it shows up next to your name.' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--color-blue)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700,
              }}>{s.step}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 3px' }}>{s.label}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gift row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <GiftIcon /> Want to gift a membership to someone?
        </span>
        <a
          href={PATREON_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', textDecoration: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-blue)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        >
          Gift on Patreon ↗
        </a>
      </div>

    </div>
  )
}

/* ── Tier card ── */
function TierCard({ tier }: { tier: typeof TIERS[number] }) {
  return (
    <div style={{
      position: 'relative',
      background: 'var(--color-surface)',
      border: `1px solid ${tier.featured ? tier.border : 'var(--color-border)'}`,
      borderRadius: '16px',
      padding: tier.featured ? '0' : '24px',
      boxShadow: tier.featured ? `0 0 32px ${tier.glow}` : 'none',
      overflow: 'hidden',
      transform: tier.featured ? 'translateY(-4px)' : 'none',
    }}>
      {/* Featured banner */}
      {tier.featured && (
        <div style={{
          background: `linear-gradient(90deg, ${tier.color}cc, ${tier.color}99)`,
          padding: '7px 16px',
          textAlign: 'center',
          fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em',
          color: '#fff', textTransform: 'uppercase',
        }}>
          Most popular
        </div>
      )}

      <div style={{ padding: tier.featured ? '24px' : '0' }}>
        {/* Icon showcase */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '6px',
          marginBottom: '20px', flexWrap: 'wrap',
        }}>
          {SAMPLE_SETS.map(set => (
            <i
              key={set}
              className={`ss ss-${set} ss-${tier.rarity} ss-grad`}
              title={`${set.toUpperCase()} · ${tier.rarity}`}
              style={{ fontSize: '32px', lineHeight: 1, opacity: 0.9 }}
            />
          ))}
        </div>

        {/* Rarity label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: tier.color, background: `${tier.color}18`,
            border: `1px solid ${tier.color}40`,
            padding: '2px 8px', borderRadius: '5px',
          }}>
            {tier.name}
          </span>
        </div>

        {/* Price */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {tier.price}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-subtle)', marginLeft: '4px' }}>/month</span>
        </div>

        {/* Description */}
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.55, margin: '0 0 20px' }}>
          {tier.description}
        </p>

        {/* Perks */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tier.perks.map(perk => (
            <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text)' }}>
              <span style={{
                width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                background: `${tier.color}20`, border: `1px solid ${tier.color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={tier.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {perk}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={PATREON_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
            padding: '11px 0', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
            textDecoration: 'none',
            background: tier.featured ? tier.color : 'transparent',
            color: tier.featured ? '#fff' : tier.color,
            border: `1.5px solid ${tier.color}`,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = tier.color
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = tier.featured ? tier.color : 'transparent'
            e.currentTarget.style.color = tier.featured ? '#fff' : tier.color
          }}
        >
          Join on Patreon ↗
        </a>
      </div>
    </div>
  )
}

function GiftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  )
}

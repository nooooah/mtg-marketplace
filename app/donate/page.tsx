'use client'

const MEMBERSHIP_URL = 'https://ganknow.com/mtgbinder?tab=membership'
const COMMON_URL     = 'https://ganknow.com/services/87185-mtgbinder-buy-me-a-coffee'

const TIERS = [
  {
    name: 'Common',
    price: '$3',
    period: 'one-time',
    rarity: 'common',
    icon: 'lea',
    color: '#aaaaaa',
    glow: 'rgba(170,170,170,0.12)',
    border: 'rgba(170,170,170,0.3)',
    description: "A one-time coffee for the dev. Get a common emblem badge on your profile as a thank-you.",
    perks: ['Common-rarity profile emblem', 'Choose any MTG set icon', 'Support the marketplace'],
    href: COMMON_URL,
    featured: false,
  },
  {
    name: 'Uncommon',
    price: '$1',
    period: 'per month',
    rarity: 'uncommon',
    icon: 'znr',
    color: '#8c9dc0',
    glow: 'rgba(140,157,192,0.15)',
    border: 'rgba(140,157,192,0.35)',
    description: 'Show your humble contribution with a silver emblem badge on your profile.',
    perks: ['Uncommon-rarity profile emblem', 'Choose any MTG set icon', 'Support the marketplace'],
    href: MEMBERSHIP_URL,
    featured: false,
  },
  {
    name: 'Rare',
    price: '$3',
    period: 'per month',
    rarity: 'rare',
    icon: 'eld',
    color: '#c5a84e',
    glow: 'rgba(197,168,78,0.18)',
    border: 'rgba(197,168,78,0.4)',
    description: 'Stand out with a gold emblem badge marking your significant contribution.',
    perks: ['Rare-rarity profile emblem', 'Choose any MTG set icon', 'Priority feature feedback'],
    href: MEMBERSHIP_URL,
    featured: true,
  },
  {
    name: 'Mythic',
    price: '$5',
    period: 'per month',
    rarity: 'mythic',
    icon: 'mom',
    color: '#e8834a',
    glow: 'rgba(232,131,74,0.15)',
    border: 'rgba(232,131,74,0.35)',
    description: 'The highest honour — a mythic emblem marking your outstanding support.',
    perks: ['Mythic-rarity profile emblem', 'Choose any MTG set icon', 'Your name in the credits'],
    href: MEMBERSHIP_URL,
    featured: false,
  },
]

export default function DonatePage() {
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '64px 1.5rem 100px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <h1 style={{
          fontFamily: "'Beleren2016', serif",
          fontSize: '32px', fontWeight: 700,
          color: 'var(--color-text)', letterSpacing: '-0.02em',
          margin: '0 0 14px',
        }}>
          Support mtgbinder
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.65, maxWidth: '500px', margin: '0 auto 6px' }}>
          mtgbinder is a free, community-built marketplace for Philippine MTG players.
          Supporters receive a <strong style={{ color: 'var(--color-text)' }}>keyrune emblem badge</strong> on their profile as a permanent mark of their contribution.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-subtle)', margin: 0 }}>
          Memberships are managed via Ganknow. Cancel anytime.
        </p>
      </div>

      {/* Tier cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
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
            { step: '1', label: 'Pick a tier', desc: 'Choose your tier on Ganknow.' },
            { step: '2', label: 'Message us', desc: 'Send your mtgbinder username to us after subscribing.' },
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
          href={MEMBERSHIP_URL}
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
          Gift on Ganknow ↗
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
      overflow: 'hidden',
      boxShadow: tier.featured ? `0 0 32px ${tier.glow}` : 'none',
      transform: tier.featured ? 'translateY(-4px)' : 'none',
    }}>
      {/* Featured banner */}
      {tier.featured && (
        <div style={{
          background: `linear-gradient(90deg, ${tier.color}cc, ${tier.color}88)`,
          padding: '7px 16px', textAlign: 'center',
          fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em',
          color: '#fff', textTransform: 'uppercase',
        }}>
          Most popular
        </div>
      )}

      <div style={{ padding: '24px' }}>
        {/* Single icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
          <i
            className={`ss ss-${tier.icon} ss-${tier.rarity} ss-grad`}
            style={{ fontSize: '52px', lineHeight: 1 }}
          />
        </div>

        {/* Rarity label */}
        <div style={{ marginBottom: '8px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: tier.color,
            background: `${tier.color}18`,
            border: `1px solid ${tier.color}40`,
            padding: '2px 8px', borderRadius: '5px',
          }}>
            {tier.name}
          </span>
        </div>

        {/* Price */}
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {tier.price}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-subtle)', marginLeft: '5px' }}>
            {tier.period}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.55, margin: '0 0 18px' }}>
          {tier.description}
        </p>

        {/* Perks */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {tier.perks.map(perk => (
            <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text)' }}>
              <span style={{
                width: '15px', height: '15px', borderRadius: '50%', flexShrink: 0,
                background: `${tier.color}20`, border: `1px solid ${tier.color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke={tier.color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {perk}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={tier.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
            padding: '10px 0', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
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
          {tier.period === 'one-time' ? 'Buy a coffee ↗' : 'Join on Ganknow ↗'}
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

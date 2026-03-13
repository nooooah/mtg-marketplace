export default function DonatePage() {
  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '72px 1.5rem 80px', textAlign: 'center' }}>

      {/* Icon */}
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed22, #2563eb22)',
        border: '1px solid rgba(124,58,237,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', fontSize: '28px',
      }}>
        ♥
      </div>

      <h1 style={{
        fontFamily: "'Beleren2016', serif",
        fontSize: '28px', fontWeight: 700,
        color: 'var(--color-text)', letterSpacing: '-0.02em',
        margin: '0 0 12px',
      }}>
        Support mtgbinder
      </h1>

      <p style={{ fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6, margin: '0 0 8px' }}>
        mtgbinder is a free, community-driven marketplace built for Philippine MTG players.
        If it's been useful to you, consider buying us a coffee — it helps keep the servers running and the features coming.
      </p>

      <p style={{ fontSize: '14px', color: 'var(--color-subtle)', margin: '0 0 40px', fontStyle: 'italic' }}>
        Donation details coming soon.
      </p>

      <a
        href="/"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '10px 20px', borderRadius: '10px',
          border: '1px solid var(--color-border)', background: 'transparent',
          color: 'var(--color-muted)', fontSize: '13px', fontWeight: 500,
          textDecoration: 'none', transition: 'all 0.15s ease',
        }}
      >
        ← Back to marketplace
      </a>
    </div>
  )
}

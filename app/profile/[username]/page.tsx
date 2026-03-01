import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileListingsSection from '@/components/ProfileListingsSection'
import type { Listing, Profile, WantedCard } from '@/types'

function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single()

  if (!profile) notFound()

  const [{ data: listings }, { data: wanted }] = await Promise.all([
    supabase.from('listings').select('*, profiles(username, avatar_url)').eq('user_id', profile.id).eq('status', 'listed').not('binder_id', 'is', null).order('created_at', { ascending: false }),
    supabase.from('wanted_cards').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
  ])

  const p = profile as Profile
  const l = (listings ?? []) as Listing[]
  const w = (wanted ?? []) as WantedCard[]
  const initials = (p.display_name ?? p.username)?.[0]?.toUpperCase() ?? '?'

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 1.5rem 80px' }}>

      {/* Profile header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '24px',
        padding: '28px 32px', background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: '16px',
        marginBottom: '36px', flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: p.avatar_url ? 'transparent' : 'var(--color-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px', fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden',
        }}>
          {p.avatar_url ? <img src={p.avatar_url} alt={p.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', margin: 0 }}>
              {p.display_name ?? p.username}
            </h1>
            {p.display_name && (
              <span style={{ fontSize: '13px', color: 'var(--color-subtle)' }}>@{p.username}</span>
            )}
          </div>
          {p.bio && (
            <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6, margin: '0 0 12px', maxWidth: '520px' }}>
              {p.bio}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <MetaBadge icon="📅" text={`Member since ${formatMemberSince(p.created_at)}`} />
            {p.location && <MetaBadge icon="📍" text={p.location} />}
            {p.preferred_lgs && <MetaBadge icon="🏠" text={p.preferred_lgs} />}
            {p.messenger_link && (
              <a href={p.messenger_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <MetaBadge icon="💬" text="Message on Messenger" />
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '24px', flexShrink: 0 }}>
          <Stat value={l.length} label="Listings" />
          <Stat value={w.length} label="Wanted" />
        </div>
      </div>

      {/* Listings section */}
      <SectionHeader
        title="Active Listings"
        subtitle={`${l.length} card${l.length !== 1 ? 's' : ''} for sale`}
      />
      {l.length === 0 ? (
        <EmptyState>No listings yet.</EmptyState>
      ) : (
        <div style={{ marginBottom: '48px' }}>
          <ProfileListingsSection listings={l} />
        </div>
      )}

      {/* Wanted section */}
      <SectionHeader
        title="Looking to Buy"
        subtitle={`${w.length} card${w.length !== 1 ? 's' : ''} on the wanted list`}
      />
      {w.length === 0 ? (
        <EmptyState>No wanted cards listed.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {w.map(item => <WantedRow key={item.id} item={item} />)}
        </div>
      )}

    </div>
  )
}

function WantedRow({ item: w }: { item: WantedCard }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '10px', padding: '12px 16px',
    }}>
      <div style={{ width: '40px', height: '56px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-2)' }}>
        {w.card_image_uri && <img src={w.card_image_uri} alt={w.card_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {w.card_name}
          </p>
          {w.is_foil && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', padding: '1px 6px', borderRadius: '5px' }}>
              FOIL
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '2px 0 0' }}>
          {w.card_set_name ?? w.card_set?.toUpperCase()}
          {w.card_collector_number && <span style={{ color: 'var(--color-subtle)' }}> · #{w.card_collector_number}</span>}
        </p>
      </div>
    </div>
  )
}

/* ─── Small components ────────────────────────────────────────────────── */

function MetaBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '12px', color: 'var(--color-muted)',
      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
      padding: '4px 10px', borderRadius: '20px',
    }}>
      {icon} {text}
    </span>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.03em' }}>{value}</p>
      <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>{label}</p>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
      <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>{subtitle}</p>
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-muted)', fontSize: '14px', marginBottom: '40px' }}>
      {children}
    </div>
  )
}

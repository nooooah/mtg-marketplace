import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PublicBindersDisplay from '@/components/PublicBindersDisplay'
import type { Listing, Profile, Binder } from '@/types'

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

  const [{ data: listings }, { data: binders }] = await Promise.all([
    supabase.from('listings').select('*, profiles(username, avatar_url)').eq('user_id', profile.id).eq('status', 'listed').not('binder_id', 'is', null).order('created_at', { ascending: false }),
    supabase.from('binders').select('*').eq('user_id', profile.id).order('display_order'),
  ])

  const p = profile as Profile
  const l = (listings ?? []) as Listing[]
  const b = (binders ?? []) as Binder[]
  const activeBinders = b.filter(binder => l.some(listing => listing.binder_id === binder.id))
  const initials = (p.display_name ?? p.username)?.[0]?.toUpperCase() ?? '?'

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 1.5rem 80px' }}>

      {/* Profile header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '20px 24px', background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: '16px',
        marginBottom: '20px', flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: p.avatar_url ? 'transparent' : 'var(--color-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden',
        }}>
          {p.avatar_url ? <img src={p.avatar_url} alt={p.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', margin: 0 }}>
              {p.display_name ?? p.username}
            </h1>
            {p.display_name && (
              <span style={{ fontSize: '12px', color: 'var(--color-subtle)' }}>@{p.username}</span>
            )}
            <Stat value={l.length} label="Listings" />
            <Stat value={activeBinders.length} label="Binders" />
          </div>
          {p.bio && (
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5, margin: '4px 0 6px', maxWidth: '520px' }}>
              {p.bio}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: p.bio ? 0 : '6px' }}>
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
      </div>

      {/* Binders section */}
      <PublicBindersDisplay
        listings={l}
        binders={b}
        displayName={p.display_name ?? p.username}
      />

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
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '12px', color: 'var(--color-muted)',
      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
      padding: '3px 8px', borderRadius: '20px',
    }}>
      <strong style={{ color: 'var(--color-text)', fontWeight: 700 }}>{value}</strong> {label}
    </span>
  )
}


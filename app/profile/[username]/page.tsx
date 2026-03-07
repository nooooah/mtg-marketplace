import type React from 'react'
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

  const [{ data: listings }, { data: binders }, { count: soldCount }] = await Promise.all([
    supabase.from('listings').select('*, profiles(username, avatar_url)').eq('user_id', profile.id).eq('status', 'listed').not('binder_id', 'is', null).order('created_at', { ascending: false }),
    supabase.from('binders').select('*').eq('user_id', profile.id).order('display_order'),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('status', 'sold'),
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
        display: 'flex', alignItems: 'flex-start', gap: '16px',
        padding: '20px 24px', background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: '16px',
        marginBottom: '20px', flexWrap: 'wrap',
      }}>
        {/* Left column: avatar + name + stats */}
        <div className="profile-card-left" style={{ display: 'flex', gap: '14px', alignItems: 'center', flexShrink: 0 }}>
          {/* Avatar */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: p.avatar_url ? 'transparent' : 'var(--color-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden',
          }}>
            {p.avatar_url ? <img src={p.avatar_url} alt={p.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>

          {/* Name + stats */}
          <div className="profile-card-name-block">
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              {p.display_name ?? p.username}
            </h1>
            {p.display_name && (
              <div style={{ fontSize: '12px', color: 'var(--color-subtle)', marginBottom: '6px' }}>@{p.username}</div>
            )}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Stat value={l.length} label="Listings" />
              <Stat value={activeBinders.length} label="Binders" />
              <Stat value={soldCount ?? 0} label="Sold" color="#10b981" />
            </div>
          </div>
        </div>

        {/* Right: bio + meta */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          {p.bio && (
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5, margin: '0 0 8px', maxWidth: '520px' }}>
              {p.bio}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <MetaBadge icon={<CalendarIcon />} text={`Member since ${formatMemberSince(p.created_at)}`} />
            {p.location && <MetaBadge icon={<LocationIcon />} text={p.location} />}
            {p.preferred_lgs && <MetaBadge icon={<StoreIcon />} text={p.preferred_lgs} />}
            {p.messenger_link && (
              <a href={p.messenger_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <MetaBadge icon={<MessengerIcon />} text="Message on Messenger" />
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

function MetaBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
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

function CalendarIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
}
function LocationIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
}
function StoreIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
}
function MessengerIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
}

function Stat({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '12px', color: 'var(--color-muted)',
      background: color ? `${color}12` : 'var(--color-surface-2)',
      border: `1px solid ${color ? `${color}30` : 'var(--color-border)'}`,
      padding: '3px 8px', borderRadius: '20px',
    }}>
      <strong style={{ color: color ?? 'var(--color-text)', fontWeight: 700 }}>{value}</strong> {label}
    </span>
  )
}


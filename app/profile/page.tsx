'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Listing, Binder } from '@/types'
import ProfileListingsSection from '@/components/ProfileListingsSection'

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function MyProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login?redirect=/profile'); return }
      setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => {
      setProfile(data as Profile)
      setLoading(false)
    })
  }, [userId])

  if (loading || !userId) {
    return (
      <PageShell>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', color: 'var(--color-muted)', fontSize: '14px' }}>
          Loading…
        </div>
      </PageShell>
    )
  }

  if (!profile) return null

  return <ProfileContent userId={userId} initialProfile={profile} />
}

/* ─── Main content ────────────────────────────────────────────────────── */

function ProfileContent({ userId, initialProfile }: { userId: string; initialProfile: Profile }) {
  const supabase = createClient()
  const [profile, setProfile] = useState(initialProfile)
  const [listings, setListings] = useState<Listing[]>([])
  const [binders, setBinders] = useState<Binder[]>([])
  const [soldCount, setSoldCount] = useState(0)
  const [listingsLoading, setListingsLoading] = useState(true)

  useEffect(() => {
    supabase.from('listings').select('*').eq('user_id', userId).eq('status', 'listed').order('created_at', { ascending: false })
      .then(({ data }) => { setListings((data ?? []) as Listing[]); setListingsLoading(false) })
    supabase.from('binders').select('*').eq('user_id', userId).order('display_order')
      .then(({ data }) => { if (data) setBinders(data as Binder[]) })
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'sold')
      .then(({ count }) => { setSoldCount(count ?? 0) })
  }, [userId])

  return (
    <PageShell>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <ProfileCard
          profile={profile}
          listingCount={listings.length}
          binderCount={binders.filter(b => listings.some(l => l.binder_id === b.id)).length}
          soldCount={soldCount}
          onSave={updated => setProfile(updated)}
        />

        <BindersDisplay listings={listings} binders={binders} loading={listingsLoading} displayName={profile.display_name ?? profile.username} />

      </div>
    </PageShell>
  )
}

/* ─── Binders Display ─────────────────────────────────────────────────── */

function BindersDisplay({ listings, binders, loading, displayName }: {
  listings: Listing[]
  binders: Binder[]
  loading: boolean
  displayName: string
}) {
  // Group by binder, filter to only non-empty
  const binderGroups = binders.map(b => ({
    binder: b,
    cards: listings.filter(l => l.binder_id === b.id),
  })).filter(g => g.cards.length > 0)

  const [selectedBinderId, setSelectedBinderId] = useState<string>(binderGroups[0]?.binder.id ?? '')

  // Keep selected tab valid when binders load
  const activeGroup = binderGroups.find(g => g.binder.id === selectedBinderId) ?? binderGroups[0]

  if (loading) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '14px' }}>
        Loading listings…
      </div>
    )
  }

  if (binderGroups.length === 0) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: 'var(--color-muted)', margin: '0 0 12px' }}>No cards listed in any binder yet.</p>
        <a href="/sell" style={{ display: 'inline-block', padding: '9px 18px', background: 'var(--color-blue)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          List a card →
        </a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

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
                onClick={() => setSelectedBinderId(binder.id)}
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

/* ─── Profile Card ────────────────────────────────────────────────────── */

function ProfileCard({ profile, listingCount, binderCount, soldCount, onSave }: {
  profile: Profile
  listingCount: number
  binderCount: number
  soldCount: number
  onSave: (p: Profile) => void
}) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [preferredLgs, setPreferredLgs] = useState(profile.preferred_lgs ?? '')
  const [messengerLink, setMessengerLink] = useState(profile.messenger_link ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      location: location.trim() || null,
      preferred_lgs: preferredLgs.trim() || null,
      messenger_link: messengerLink.trim() || null,
      bio: bio.trim() || null,
    }).eq('id', profile.id).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    onSave(data as Profile)
    setEditing(false)
  }

  const handleCancel = () => {
    setDisplayName(profile.display_name ?? '')
    setAvatarUrl(profile.avatar_url ?? '')
    setLocation(profile.location ?? '')
    setPreferredLgs(profile.preferred_lgs ?? '')
    setMessengerLink(profile.messenger_link ?? '')
    setBio(profile.bio ?? '')
    setError('')
    setEditing(false)
  }

  const initials = (profile.display_name ?? profile.username)?.[0]?.toUpperCase() ?? '?'

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '16px',
      padding: '20px 24px',
      marginBottom: '20px',
    }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <ProfileField label="Display name">
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={profile.username} />
          </ProfileField>
          <ProfileField label="Profile photo URL">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
                style={{ flex: 1 }}
              />
              {avatarUrl.trim() && (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                  <img
                    src={avatarUrl.trim()}
                    alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </div>
          </ProfileField>
          <ProfileField label="Bio">
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder="A few words about yourself…" style={{ resize: 'vertical' }} />
          </ProfileField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <ProfileField label="Location">
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Manila, PH" />
            </ProfileField>
            <ProfileField label="Preferred Pod / LGS">
              <input value={preferredLgs} onChange={e => setPreferredLgs(e.target.value)} placeholder="e.g. Neutral Grounds" />
            </ProfileField>
          </div>
          <ProfileField label="Facebook Messenger link">
            <input value={messengerLink} onChange={e => setMessengerLink(e.target.value)} placeholder="https://m.me/yourname" />
          </ProfileField>
          {error && <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '7px 16px', borderRadius: '8px', background: 'var(--color-blue)', border: 'none',
              color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={handleCancel} style={{
              padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--color-border)',
              background: 'transparent', color: 'var(--color-muted)', fontSize: '13px', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-card-view" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Left column: avatar + name + stats (stacks vertically on mobile) */}
          <div className="profile-card-left" style={{ display: 'flex', gap: '14px', alignItems: 'center', flexShrink: 0 }}>
            {/* Avatar */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
              background: profile.avatar_url ? 'transparent' : 'var(--color-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 800, color: '#fff', overflow: 'hidden',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>

            {/* Name + stats (shown beside avatar on desktop, below on mobile) */}
            <div className="profile-card-name-block">
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                {profile.display_name ?? profile.username}
              </h1>
              {profile.display_name && (
                <div style={{ fontSize: '12px', color: 'var(--color-subtle)', marginBottom: '6px' }}>@{profile.username}</div>
              )}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <StatBadge value={listingCount} label="Listings" />
                <StatBadge value={binderCount} label="Binders" />
                <StatBadge value={soldCount} label="Sold" color="#10b981" />
              </div>
            </div>
          </div>

          {/* Right / main: meta + bio + buttons */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <a
              href={`/profile/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-muted)', textDecoration: 'none', marginBottom: '8px' }}
            >
              <LinkIcon />
              mtgbinder.app/profile/{profile.username}
            </a>
            {profile.bio && (
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5, margin: '0 0 8px', maxWidth: '520px' }}>
                {profile.bio}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
              <MetaBadge icon={<CalendarIcon />} text={`Member since ${formatMemberSince(profile.created_at)}`} />
              {profile.location && <MetaBadge icon={<LocationIcon />} text={profile.location} />}
              {profile.preferred_lgs && <MetaBadge icon={<StoreIcon />} text={profile.preferred_lgs} />}
              {profile.messenger_link && (
                <a href={profile.messenger_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <MetaBadge icon={<MessengerIcon />} text="Message on Messenger" clickable />
                </a>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={`/profile/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                  background: 'transparent', color: 'var(--color-muted)', fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none',
                }}
              >
                <EyeIcon /> Preview
              </a>
              <button onClick={() => setEditing(true)} style={{
                padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-muted)', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <EditIcon /> Edit profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Small UI components ─────────────────────────────────────────────── */

function MetaBadge({ icon, text, clickable }: { icon: React.ReactNode; text: string; clickable?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '12px', color: 'var(--color-muted)',
      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
      padding: '4px 10px', borderRadius: '20px',
      transition: clickable ? 'border-color 0.15s ease, color 0.15s ease' : undefined,
    }}>
      {icon} {text}
    </span>
  )
}

function StatBadge({ value, label, color }: { value: number; label: string; color?: string }) {
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

function ProfileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  )
}

function TabEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-muted)', fontSize: '14px' }}>
      {children}
    </div>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 1.5rem 80px' }}>{children}</div>
}

/* ─── Icons ───────────────────────────────────────────────────────────── */
function EditIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function CalendarIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
}
function LocationIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
}
function StoreIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
}
function MessengerIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
}
function LinkIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
}
function EyeIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
}

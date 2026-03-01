'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Listing } from '@/types'
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
  const [listingsLoading, setListingsLoading] = useState(true)

  useEffect(() => {
    supabase.from('listings').select('*').eq('user_id', userId).eq('status', 'listed').order('created_at', { ascending: false })
      .then(({ data }) => { setListings((data ?? []) as Listing[]); setListingsLoading(false) })
  }, [userId])

  return (
    <PageShell>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <ProfileCard
          profile={profile}
          listingCount={listings.length}
          onSave={updated => setProfile(updated)}
        />

        <ListingsTab listings={listings} loading={listingsLoading} />

      </div>
    </PageShell>
  )
}

/* ─── Profile Card ────────────────────────────────────────────────────── */

function ProfileCard({ profile, listingCount, onSave }: {
  profile: Profile
  listingCount: number
  onSave: (p: Profile) => void
}) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [preferredLgs, setPreferredLgs] = useState(profile.preferred_lgs ?? '')
  const [messengerLink, setMessengerLink] = useState(profile.messenger_link ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
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
      padding: '28px 32px',
      marginBottom: '28px',
    }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Avatar */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
          background: profile.avatar_url ? 'transparent' : 'var(--color-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '30px', fontWeight: 800, color: '#fff', overflow: 'hidden',
        }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ProfileField label="Display name">
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={profile.username} />
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
                  padding: '8px 18px', borderRadius: '8px', background: 'var(--color-blue)', border: 'none',
                  color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button onClick={handleCancel} style={{
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--color-border)',
                  background: 'transparent', color: 'var(--color-muted)', fontSize: '13px', cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', margin: 0 }}>
                  {profile.display_name ?? profile.username}
                </h1>
                {profile.display_name && (
                  <span style={{ fontSize: '13px', color: 'var(--color-subtle)' }}>@{profile.username}</span>
                )}
              </div>
              {profile.bio && (
                <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6, margin: '0 0 12px', maxWidth: '560px' }}>
                  {profile.bio}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <MetaBadge icon={<CalendarIcon />} text={`Member since ${formatMemberSince(profile.created_at)}`} />
                {profile.location && <MetaBadge icon={<LocationIcon />} text={profile.location} />}
                {profile.preferred_lgs && <MetaBadge icon={<StoreIcon />} text={profile.preferred_lgs} />}
                {profile.messenger_link && (
                  <a href={profile.messenger_link} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}>
                    <MetaBadge icon={<MessengerIcon />} text="Message on Messenger" clickable />
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Stats + edit button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px', flexShrink: 0 }}>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{
              padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--color-border)',
              background: 'transparent', color: 'var(--color-muted)', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <EditIcon /> Edit profile
            </button>
          )}
          <div style={{ display: 'flex', gap: '20px' }}>
            <StatBadge value={listingCount} label="Listings" />
          </div>
        </div>

      </div>
    </div>
  )
}

/* ─── Listings Tab ────────────────────────────────────────────────────── */

function ListingsTab({ listings, loading }: { listings: Listing[]; loading: boolean }) {
  if (loading) return <TabEmpty>Loading listings…</TabEmpty>
  if (listings.length === 0) {
    return (
      <TabEmpty>
        You have no active listings.{' '}
        <a href="/sell" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>List a card →</a>
      </TabEmpty>
    )
  }
  return <ProfileListingsSection listings={listings} />
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

function StatBadge({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.03em' }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0 }}>{label}</p>
    </div>
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

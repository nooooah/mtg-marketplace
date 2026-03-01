'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Listing, WantedCard, ScryfallCard } from '@/types'
import { useCardHover, HoverCardImage } from '@/components/CardHoverPreview'
import ProfileListingsSection from '@/components/ProfileListingsSection'
import { formatDate } from '@/lib/utils'

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
  const [tab, setTab] = useState<'listings' | 'wanted'>('listings')
  const [listings, setListings] = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)

  useEffect(() => {
    supabase.from('listings').select('*').eq('user_id', userId).eq('status', 'listed').order('created_at', { ascending: false })
      .then(({ data }) => { setListings((data ?? []) as Listing[]); setListingsLoading(false) })
  }, [userId])

  return (
    <PageShell>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Profile card */}
        <ProfileCard
          profile={profile}
          listingCount={listings.length}
          onSave={updated => setProfile(updated)}
        />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {(['listings', 'wanted'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 18px', borderRadius: '7px', border: 'none', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease',
              background: tab === t ? 'var(--color-surface-2)' : 'transparent',
              color: tab === t ? 'var(--color-text)' : 'var(--color-muted)',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}>
              {t === 'listings' ? 'My Listings' : 'Looking to Buy'}
            </button>
          ))}
        </div>

        {tab === 'listings' && (
          <ListingsTab listings={listings} loading={listingsLoading} />
        )}
        {tab === 'wanted' && (
          <WantedTab userId={userId} />
        )}

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

  // Editable fields
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

/* ─── Wanted Tab ──────────────────────────────────────────────────────── */

type WantedPrinting = {
  id: string
  set: string
  set_name: string
  collector_number: string
  image_uri: string | null
  rarity: string
  usd: string | null
}

function WantedTab({ userId }: { userId: string }) {
  const supabase = createClient()
  const [wanted, setWanted] = useState<WantedCard[]>([])
  const [loadingWanted, setLoadingWanted] = useState(true)

  // Add card flow
  const [cardQuery, setCardQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ScryfallCard[]>([])
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null)
  const [isFoil, setIsFoil] = useState(false)
  const [adding, setAdding] = useState(false)

  // Printing picker
  const [showPrintings, setShowPrintings] = useState(false)
  const [printings, setPrintings] = useState<WantedPrinting[]>([])
  const [printingsLoading, setPrintingsLoading] = useState(false)
  const printingsFetched = useRef(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Fetch wanted list
  useEffect(() => {
    supabase.from('wanted_cards').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setWanted((data ?? []) as WantedCard[]); setLoadingWanted(false) })
  }, [userId])

  // Scryfall autocomplete
  useEffect(() => {
    if (!cardQuery.trim() || selectedCard) { setResults([]); return }
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardQuery)}&unique=cards&order=name&limit=12`)
        if (res.ok) { const data = await res.json(); setResults(data.data ?? []) }
        else setResults([])
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(searchTimeout.current)
  }, [cardQuery, selectedCard])

  const selectCard = (card: ScryfallCard) => {
    setSelectedCard(card)
    setCardQuery(card.name)
    setResults([])
    setShowPrintings(false)
    setPrintings([])
    printingsFetched.current = false
    setIsFoil(false)
  }

  const clearCard = () => {
    setSelectedCard(null); setCardQuery(''); setResults([])
    setShowPrintings(false); setPrintings([])
    printingsFetched.current = false
  }

  const openPrintings = async () => {
    if (!selectedCard) return
    setShowPrintings(v => !v)
    if (printingsFetched.current) return
    printingsFetched.current = true
    setPrintingsLoading(true)
    try {
      const res = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(selectedCard.name)}"&unique=prints&order=released`)
      const data = await res.json()
      if (data.data) {
        setPrintings((data.data as ScryfallCard[]).map(c => ({
          id: c.id,
          set: c.set,
          set_name: c.set_name,
          collector_number: c.collector_number,
          image_uri: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? null,
          rarity: c.rarity,
          usd: c.prices?.usd ?? null,
        })))
      }
    } catch { /* fail silently */ }
    setPrintingsLoading(false)
  }

  const selectPrinting = (p: WantedPrinting) => {
    if (!selectedCard) return
    setSelectedCard({
      ...selectedCard,
      id: p.id,
      set: p.set,
      set_name: p.set_name,
      collector_number: p.collector_number,
      image_uris: p.image_uri ? { ...selectedCard.image_uris, normal: p.image_uri, small: p.image_uri, large: p.image_uri, art_crop: p.image_uri } : selectedCard.image_uris,
    })
    setShowPrintings(false)
  }

  const getCardImage = (card: ScryfallCard) =>
    card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null

  const handleAdd = async () => {
    if (!selectedCard) return
    setAdding(true)
    const { data, error } = await supabase.from('wanted_cards').insert({
      user_id: userId,
      card_id: selectedCard.id,
      card_name: selectedCard.name,
      card_set: selectedCard.set,
      card_set_name: selectedCard.set_name,
      card_image_uri: getCardImage(selectedCard),
      card_collector_number: selectedCard.collector_number,
      is_foil: isFoil,
    }).select().single()
    setAdding(false)
    if (!error && data) {
      setWanted(prev => [data as WantedCard, ...prev])
      clearCard()
    }
  }

  const handleRemove = async (id: string) => {
    setWanted(prev => prev.filter(w => w.id !== id))
    await supabase.from('wanted_cards').delete().eq('id', id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Add card panel */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px 24px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '14px', letterSpacing: '0.03em' }}>
          ADD A CARD YOU&#39;RE LOOKING FOR
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Search / selected card */}
          <div style={{ position: 'relative' }}>
            {selectedCard ? (
              <div style={{ display: 'flex', gap: '14px', padding: '12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '10px', alignItems: 'flex-start' }}>
                {getCardImage(selectedCard) && (
                  <HoverCardImage src={getCardImage(selectedCard)!} alt={selectedCard.name} style={{ width: '54px', borderRadius: '6px', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '14px', margin: '0 0 3px' }}>{selectedCard.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
                    {selectedCard.set_name} · {selectedCard.set.toUpperCase()} #{selectedCard.collector_number}
                  </p>
                </div>
                <button type="button" onClick={clearCard} style={{
                  background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)',
                  borderRadius: '7px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', flexShrink: 0,
                }}>
                  Change
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtle)', pointerEvents: 'none' }}>
                    <SearchIcon />
                  </div>
                  <input
                    type="text" placeholder="Search by card name…" value={cardQuery}
                    onChange={e => setCardQuery(e.target.value)}
                    style={{ paddingLeft: '38px', paddingRight: '12px' }}
                  />
                  {searching && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtle)', fontSize: '12px' }}>
                      Searching…
                    </div>
                  )}
                </div>
                {results.length > 0 && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: '280px', overflowY: 'auto' }}>
                    {results.map(card => <WantedSearchRow key={card.id} card={card} onSelect={selectCard} />)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Printing picker + foil toggle — only shown after card selected */}
          {selectedCard && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Change printing */}
                <button onClick={openPrintings} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                  border: `1px solid ${showPrintings ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
                  background: showPrintings ? 'var(--color-blue-glow)' : 'transparent',
                  color: showPrintings ? 'var(--color-blue)' : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all 0.12s ease',
                }}>
                  <PrintingIcon /> Change printing <span style={{ opacity: 0.6, fontSize: '10px' }}>{showPrintings ? '▲' : '▼'}</span>
                </button>

                {/* Foil toggle */}
                <button onClick={() => setIsFoil(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                  border: `1px solid ${isFoil ? 'rgba(234,179,8,0.5)' : 'var(--color-border)'}`,
                  background: isFoil ? 'rgba(234,179,8,0.08)' : 'transparent',
                  color: isFoil ? '#fbbf24' : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all 0.12s ease',
                }}>
                  <FoilIcon active={isFoil} /> {isFoil ? 'Foil ✓' : 'Foil'}
                </button>
              </div>

              {/* Printing grid */}
              {showPrintings && (
                <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Select a printing
                  </p>
                  {printingsLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '8px' }}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '6px' }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                      {printings.map(p => {
                        const isSelected = p.id === selectedCard.id
                        return (
                          <button key={p.id} onClick={() => selectPrinting(p)} title={`${p.set_name} #${p.collector_number}`} style={{
                            padding: 0, border: `2px solid ${isSelected ? 'var(--color-blue)' : 'transparent'}`,
                            borderRadius: '7px', overflow: 'hidden', background: isSelected ? 'var(--color-blue-glow)' : 'var(--color-surface)',
                            cursor: 'pointer', outline: 'none', transition: 'border-color 0.12s ease',
                            display: 'flex', flexDirection: 'column',
                          }}>
                            {p.image_uri
                              ? <HoverCardImage src={p.image_uri} alt={p.set_name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                              : <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--color-surface-2)' }} />}
                            <div style={{ padding: '2px 3px', textAlign: 'center' }}>
                              <p style={{ fontSize: '9px', fontWeight: 700, color: isSelected ? 'var(--color-blue)' : 'var(--color-muted)', textTransform: 'uppercase', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.set.toUpperCase()}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Add button */}
              <button onClick={handleAdd} disabled={adding} style={{
                alignSelf: 'flex-start', padding: '9px 20px', borderRadius: '8px',
                background: adding ? 'var(--color-surface-2)' : 'var(--color-blue)', border: 'none',
                color: '#fff', fontSize: '13px', fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer',
                opacity: adding ? 0.6 : 1,
              }}>
                {adding ? 'Adding…' : 'Add to wanted list'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wanted list */}
      {loadingWanted ? (
        <TabEmpty>Loading…</TabEmpty>
      ) : wanted.length === 0 ? (
        <TabEmpty>Your wanted list is empty. Search for a card above to add one.</TabEmpty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {wanted.map(w => <WantedRow key={w.id} item={w} onRemove={() => handleRemove(w.id)} />)}
        </div>
      )}

    </div>
  )
}

function WantedRow({ item: w, onRemove }: { item: WantedCard; onRemove: () => void }) {
  const { onMouseMove, onMouseLeave, preview } = useCardHover(w.card_image_uri ?? '')
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '10px', padding: '12px 16px',
    }}>
      {preview}
      <div onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
        style={{ width: '40px', height: '56px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-2)' }}>
        {w.card_image_uri && <img src={w.card_image_uri} alt={w.card_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
          <span style={{ color: 'var(--color-subtle)' }}> · Added {formatDate(w.created_at)}</span>
        </p>
      </div>
      <button onClick={onRemove} style={{
        width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
        background: 'transparent', border: '1px solid var(--color-border)',
        color: 'var(--color-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s ease',
      }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-subtle)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}>
        <XIcon />
      </button>
    </div>
  )
}

/* ─── Search row for wanted tab ───────────────────────────────────────── */

function WantedSearchRow({ card, onSelect }: { card: ScryfallCard; onSelect: (c: ScryfallCard) => void }) {
  const [hovered, setHovered] = useState(false)
  const thumb = card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small ?? null
  const normalImg = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? ''
  const { onMouseMove: onImgMove, onMouseLeave: onImgLeave, preview: imgPreview } = useCardHover(normalImg)
  return (
    <button type="button" onClick={() => onSelect(card)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 14px', background: hovered ? 'var(--color-surface-2)' : 'transparent', border: 'none', borderRadius: 0, textAlign: 'left', cursor: 'pointer', transition: 'background 0.1s ease' }}>
      {thumb && (
        <>
          {imgPreview}
          <img src={thumb} alt={card.name} style={{ width: '34px', borderRadius: '4px', flexShrink: 0 }} onMouseMove={onImgMove} onMouseLeave={onImgLeave} />
        </>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</p>
        <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0 }}>{card.set_name} · {card.set.toUpperCase()}</p>
      </div>
    </button>
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
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function EditIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
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
function PrintingIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
}
function FoilIcon({ active }: { active: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={active ? '#fbbf24' : 'none'} stroke={active ? '#fbbf24' : 'currentColor'} strokeWidth={2}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

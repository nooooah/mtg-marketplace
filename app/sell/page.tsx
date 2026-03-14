'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ScryfallCard, CardCondition, Binder } from '@/types'
import { useCardHover, HoverCardImage } from '@/components/CardHoverPreview'
import { daysAgo, getCardImage } from '@/lib/utils'

const CONDITIONS: { value: CardCondition; label: string }[] = [
  { value: 'NM',  label: 'Near Mint (NM)' },
  { value: 'LP',  label: 'Lightly Played (LP)' },
  { value: 'MP',  label: 'Moderately Played (MP)' },
  { value: 'HP',  label: 'Heavily Played (HP)' },
  { value: 'DMG', label: 'Damaged (DMG)' },
]

const CONDITION_SHORT: { value: CardCondition; label: string }[] = [
  { value: 'NM',  label: 'NM' },
  { value: 'LP',  label: 'LP' },
  { value: 'MP',  label: 'MP' },
  { value: 'HP',  label: 'HP' },
  { value: 'DMG', label: 'DMG' },
]

const CONDITION_COLOR = {
  NM:  'var(--color-nm)',
  LP:  'var(--color-lp)',
  MP:  'var(--color-mp)',
  HP:  'var(--color-hp)',
  DMG: 'var(--color-dmg)',
} as const

/* ─── Page ────────────────────────────────────────────────────────────── */

const FEATURES: { headline: string; body: string; image: string | null; mana: string; accent: string }[] = [
  {
    headline: 'Create a digital copy of your binder.',
    body: 'List every card you own in minutes. Search the Scryfall database, set your price, and go live instantly. Your binder, always up to date.',
    image: null,
    mana: '/mana/plains.svg',
    accent: 'rgba(248,246,216,0.07)',
  },
  {
    headline: 'Share your public profile and binders — your online storefront.',
    body: 'Every seller gets a public profile page. Share your link, let buyers browse your full collection, and build your reputation in the community.',
    image: null,
    mana: '/mana/island.svg',
    accent: 'rgba(193,215,233,0.07)',
  },
  {
    headline: 'Utilize search and sort functions.',
    body: 'Buyers can search across every binder on the platform — by card name, set, condition, price, and more. Getting discovered has never been easier.',
    image: null,
    mana: '/mana/forest.svg',
    accent: 'rgba(163,192,149,0.07)',
  },
  {
    headline: 'Track your sales and data.',
    body: 'Know what\'s selling, at what price, and when. Keep tabs on your listed, unlisted, and sold inventory all from one dashboard.',
    image: null,
    mana: '/mana/swamp.svg',
    accent: 'rgba(186,177,171,0.07)',
  },
  {
    headline: 'Make a deal in Messenger and meetup at your local LGS — like we always do.',
    body: 'No shipping, no escrow, no nonsense. Find the card, message the seller, and meetup at your local game store. The way Filipino MTG has always worked.',
    image: null,
    mana: '/mana/mountain.svg',
    accent: 'rgba(228,153,119,0.07)',
  },
]

/* Floating mana decoration element */
function ManaBg({ src, style }: { src: string; style: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none', userSelect: 'none', opacity: 0.06, ...style }} />
  )
}

export default function SellPage() {
  const supabase = createClient()

  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
      setAuthChecked(true)
    })
  }, [])

  if (!authChecked) return <PageShell><LoadingState /></PageShell>

  if (!userId) {
    return (
      <div style={{ overflowX: 'hidden' }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', textAlign: 'center', padding: '96px 24px 80px', overflow: 'hidden' }}>
          {/* Background mana decorations */}
          <ManaBg src="/mana/plains.svg"   style={{ width: 340, top: -60,  left: -80 }} />
          <ManaBg src="/mana/island.svg"   style={{ width: 280, top: 20,   right: -60 }} />
          <ManaBg src="/mana/forest.svg"   style={{ width: 200, bottom: -40, left: '20%' }} />
          <ManaBg src="/mana/mountain.svg" style={{ width: 220, bottom: -20, right: '15%' }} />
          <ManaBg src="/mana/swamp.svg"    style={{ width: 180, top: 40,    left: '45%' }} />

          {/* Gradient glow blob */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
            {/* Eyebrow */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 14px', borderRadius: '999px', marginBottom: '24px',
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
              fontSize: '12px', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
              Filipino MTG Community Marketplace
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.1,
              fontFamily: "'Beleren2016', serif", letterSpacing: '-0.02em',
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #f8fafc 30%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Your binder,<br />online.
            </h1>

            <p style={{ fontSize: '18px', color: 'var(--color-muted)', marginBottom: '40px', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 40px' }}>
              Add your binder to the community database. Create your own storefront. Make deals locally.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/auth/signup" style={{
                padding: '14px 32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                color: '#fff', fontSize: '15px', fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
                transition: 'opacity 0.15s',
              }}>
                Create free account
              </a>
              <a href="/auth/login?redirect=/sell" style={{
                padding: '14px 28px', borderRadius: '10px',
                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                color: 'var(--color-muted)', fontSize: '15px', fontWeight: 500,
                textDecoration: 'none',
              }}>
                Log in
              </a>
            </div>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--color-border), transparent)', margin: '0 48px' }} />

        {/* ── Feature rows ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          {FEATURES.map((feat, i) => {
            const isEven = i % 2 === 0
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '64px', alignItems: 'center',
                padding: '80px 0',
                borderBottom: i < FEATURES.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
              className="feature-row"
              >
                {/* Text side */}
                <div style={{ order: isEven ? 0 : 1 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '10px', marginBottom: '16px',
                    background: feat.accent, border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '16px', fontWeight: 900, color: 'var(--color-muted)',
                    fontFamily: 'monospace',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h2 style={{
                    fontSize: '26px', fontWeight: 800, lineHeight: 1.25,
                    color: 'var(--color-text)', letterSpacing: '-0.02em',
                    marginBottom: '14px', fontFamily: "'Beleren2016', serif",
                  }}>
                    {feat.headline}
                  </h2>
                  <p style={{ fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.75, margin: 0 }}>
                    {feat.body}
                  </p>
                </div>

                {/* Image side */}
                <div style={{ order: isEven ? 1 : 0, position: 'relative' }}>
                  <div style={{
                    position: 'relative', borderRadius: '16px', overflow: 'hidden',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    aspectRatio: '16/10',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                  }}>
                    {/* Mana watermark */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={feat.mana} alt="" aria-hidden="true" style={{ position: 'absolute', width: '55%', opacity: 0.04, pointerEvents: 'none' }} />
                    {feat.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={feat.image} alt={feat.headline} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Image coming soon
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Glow accent behind card */}
                  <div style={{
                    position: 'absolute', inset: '-20px', borderRadius: '24px',
                    background: `radial-gradient(ellipse at center, ${feat.accent.replace('0.07', '0.15')} 0%, transparent 70%)`,
                    zIndex: -1, pointerEvents: 'none',
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Bottom CTA ───────────────────────────────────────────────── */}
        <div style={{ position: 'relative', textAlign: 'center', padding: '96px 24px', overflow: 'hidden' }}>
          <ManaBg src="/mana/swamp.svg"    style={{ width: 300, top: -40,  left: -60 }} />
          <ManaBg src="/mana/mountain.svg" style={{ width: 280, bottom: -40, right: -40 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', maxWidth: '540px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, lineHeight: 1.15,
              fontFamily: "'Beleren2016', serif", letterSpacing: '-0.02em',
              color: 'var(--color-text)', marginBottom: '16px',
            }}>
              Ready to list your first card?
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--color-muted)', marginBottom: '36px', lineHeight: 1.6 }}>
              Free to join. No listing fees. Just the community buying and selling the way it&apos;s always been done.
            </p>
            <a href="/auth/signup" style={{
              display: 'inline-block', padding: '15px 40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: '#fff', fontSize: '16px', fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
            }}>
              Join now — it&apos;s free
            </a>
          </div>
        </div>

        {/* Responsive style for feature rows */}
        <style>{`
          @media (max-width: 700px) {
            .feature-row {
              grid-template-columns: 1fr !important;
              gap: 32px !important;
              padding: 48px 0 !important;
            }
            .feature-row > div {
              order: unset !important;
            }
          }
        `}</style>
      </div>
    )
  }

  return <SellForm userId={userId} />
}

/* ─── Sell Form (tab wrapper) ─────────────────────────────────────────── */

function SellForm({ userId }: { userId: string }) {
  const [tab, setTab] = useState<'single' | 'bulk'>('single')

  return (
    <PageShell>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', marginBottom: '6px' }}>
            List a Card
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Search for a card, set your price, and go live instantly.
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {(['single', 'bulk'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 16px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: tab === t ? 'var(--color-surface-2)' : 'transparent',
                color: tab === t ? 'var(--color-text)' : 'var(--color-muted)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {t === 'single' ? 'Single card' : 'Bulk import'}
            </button>
          ))}
        </div>

        {tab === 'single'
          ? <SingleCardForm userId={userId} />
          : <BulkImportForm userId={userId} />
        }
      </div>
    </PageShell>
  )
}

/* ─── Single Card Form ────────────────────────────────────────────────── */

function SingleCardForm({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const [cardQuery, setCardQuery] = useState('')
  const [scryfallResults, setScryfallResults] = useState<ScryfallCard[]>([])
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [condition, setCondition] = useState<CardCondition>('NM')
  const [isFoil, setIsFoil] = useState(false)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')

  const [binders, setBinders] = useState<Binder[]>([])
  const [selectedBinderId, setSelectedBinderId] = useState<string | null>(null)
  const [creatingBinder, setCreatingBinder] = useState(false)
  const [newBinderName, setNewBinderName] = useState('')
  const [createBinderLoading, setCreateBinderLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Market overview — other sellers listing the same card
  type MarketRow = { id: string; card_set: string; card_set_name: string; card_rarity: string | null; is_foil: boolean; condition: string; quantity: number; price: number; created_at: string; profiles?: { username: string; display_name: string | null } | null }
  const [marketListings, setMarketListings] = useState<MarketRow[]>([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketSort, setMarketSort] = useState<'price_asc' | 'price_desc' | 'date_desc' | 'date_asc'>('price_asc')
  const [marketSortPicked, setMarketSortPicked] = useState(false)

  // Change printing
  const [printingResults, setPrintingResults] = useState<ScryfallCard[]>([])
  const [printingsLoading, setPrintingsLoading] = useState(false)
  const [showPrintings, setShowPrintings] = useState(false)

  const fetchPrintings = async (cardName: string) => {
    setPrintingsLoading(true)
    setShowPrintings(true)
    try {
      const res = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(cardName)}"&unique=prints&order=released`)
      if (res.ok) {
        const data = await res.json()
        setPrintingResults(data.data ?? [])
      } else { setPrintingResults([]) }
    } catch { setPrintingResults([]) }
    finally { setPrintingsLoading(false) }
  }

  useEffect(() => {
    supabase.from('binders').select('*').eq('user_id', userId).order('display_order')
      .then(({ data }) => { if (data) setBinders(data as Binder[]) })
  }, [userId])

  useEffect(() => {
    if (!cardQuery.trim() || selectedCard) { setScryfallResults([]); return }
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardQuery)}&unique=prints&order=name&limit=20`)
        if (res.ok) {
          const data = await res.json()
          setScryfallResults(data.data ?? [])
        } else { setScryfallResults([]) }
      } catch { setScryfallResults([]) }
      finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(searchTimeout.current)
  }, [cardQuery, selectedCard])

  // Fetch market listings whenever the selected card changes
  // Uses card_name so all printings + foil variants of the same card are included
  useEffect(() => {
    if (!selectedCard) { setMarketListings([]); return }
    setMarketLoading(true)
    setMarketSortPicked(false)
    ;(async () => {
      // First try with profiles join
      const { data, error } = await supabase
        .from('listings')
        .select('id, card_set, card_set_name, card_rarity, is_foil, condition, quantity, price, created_at, profiles(username, display_name)')
        .ilike('card_name', selectedCard.name)
        .eq('status', 'listed')
        .neq('user_id', userId)
        .gt('quantity', 0)
        .order('price', { ascending: true })
        .limit(50)

      if (error || !data) {
        // Fallback: try without profiles join in case of join issue
        const { data: fallback } = await supabase
          .from('listings')
          .select('id, card_set, card_set_name, card_rarity, is_foil, condition, quantity, price, created_at, user_id')
          .ilike('card_name', selectedCard.name)
          .eq('status', 'listed')
          .neq('user_id', userId)
          .gt('quantity', 0)
          .order('price', { ascending: true })
          .limit(50)
        setMarketListings((fallback ?? []) as MarketRow[])
      } else {
        // Supabase infers profiles as array from the join; cast through unknown
        setMarketListings((data as unknown) as MarketRow[])
      }
      setMarketLoading(false)
    })()
  }, [selectedCard])

  const selectCard = (card: ScryfallCard) => {
    setSelectedCard(card); setCardQuery(card.name); setScryfallResults([]); setPrice('')
    setShowPrintings(false); setPrintingResults([])
  }
  const applyMultiplier = (rate: number) => {
    // Use Manabox (TCGPlayer USD) price
    const basePrice = isFoil
      ? (selectedCard?.prices?.usd_foil ?? selectedCard?.prices?.usd)
      : selectedCard?.prices?.usd
    if (!basePrice) return
    setPrice(String(Math.round(parseFloat(basePrice) * rate)))
  }
  const clearCard = () => { setSelectedCard(null); setCardQuery(''); setPrice(''); setIsFoil(false) }
  const handleCreateBinder = async () => {
    const name = newBinderName.trim()
    if (!name) return
    setCreateBinderLoading(true)
    const { data } = await supabase.from('binders')
      .insert({ user_id: userId, name, display_order: binders.length })
      .select().single()
    if (data) {
      setBinders(prev => [...prev, data as Binder])
      setSelectedBinderId((data as Binder).id)
    }
    setCreatingBinder(false)
    setNewBinderName('')
    setCreateBinderLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!selectedCard) { setError('Please select a card.'); return }
    if (!price || parseFloat(price) <= 0) { setError('Please enter a valid price.'); return }
    setSubmitting(true)
    try {
      const newQty   = parseInt(quantity) || 1
      const newPrice = parseFloat(price)

      // Check for an identical existing listed entry to merge into
      const { data: existing } = await supabase
        .from('listings')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('card_id', selectedCard.id)
        .eq('condition', condition)
        .eq('is_foil', isFoil)
        .eq('price', newPrice)
        .eq('status', 'listed')
        .maybeSingle()

      if (existing) {
        // Duplicate found — increment quantity instead of creating a new row
        const { error: updateError } = await supabase
          .from('listings')
          .update({ quantity: existing.quantity + newQty })
          .eq('id', existing.id)
        if (updateError) setError(updateError.message)
        else setSuccess(true)
      } else {
        // No duplicate — create new listing
        const { error: insertError } = await supabase.from('listings').insert({
          user_id: userId,
          card_id: selectedCard.id,
          card_name: selectedCard.name,
          card_set: selectedCard.set,
          card_set_name: selectedCard.set_name,
          card_image_uri: getCardImage(selectedCard),
          card_rarity: selectedCard.rarity,
          card_mana_cost: selectedCard.mana_cost,
          card_type: selectedCard.type_line,
          condition,
          is_foil: isFoil,
          price: newPrice,
          quantity: newQty,
          notes: notes.trim() || null,
          usd_price: isFoil
            ? parseFloat(selectedCard?.prices?.usd_foil ?? selectedCard?.prices?.usd ?? '0') || null
            : parseFloat(selectedCard?.prices?.usd ?? '0') || null,
          binder_id: selectedBinderId,
        })
        if (insertError) setError(insertError.message)
        else setSuccess(true)
      }
    } catch { setError('Something went wrong. Please try again.') }
    finally { setSubmitting(false) }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckIcon size={24} color="#22c55e" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text)' }}>Listing created!</h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '28px' }}>Your card is now live on the marketplace.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => { setSuccess(false); clearCard(); setCondition('NM'); setIsFoil(false); setQuantity('1'); setNotes('') }}
            style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '14px', fontWeight: 500 }}>
            List another
          </button>
          <button onClick={() => router.push('/my-listings')}
            style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-blue)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            Show my listings
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <FormSection title="1. Find your card">
        <div style={{ position: 'relative' }}>
          {selectedCard ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ display: 'flex', gap: '16px', padding: '14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: showPrintings ? '10px 10px 0 0' : '10px', alignItems: 'flex-start' }}>
                {getCardImage(selectedCard) && (
                  <HoverCardImage src={getCardImage(selectedCard)!} alt={selectedCard.name} style={{ width: '64px', borderRadius: '6px', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '15px', margin: '0 0 3px' }}>{selectedCard.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className={`ss ss-${selectedCard.set.toLowerCase()} ss-${selectedCard.rarity.toLowerCase()} ss-grad`} style={{ fontSize: '14px' }} />
                    {selectedCard.set_name} · {selectedCard.set.toUpperCase()} #{selectedCard.collector_number}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-subtle)', margin: 0, textTransform: 'capitalize' }}>{selectedCard.rarity} · {selectedCard.type_line}</p>
                  {selectedCard.prices?.usd && (
                    <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: '4px 0 0' }}>
                      TCGPlayer: <strong style={{ color: 'var(--color-text)' }}>${selectedCard.prices.usd} USD</strong>
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
                  <button type="button" onClick={clearCard}
                    style={{ background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: '7px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}>
                    Change card
                  </button>
                  <button type="button"
                    onClick={() => showPrintings ? setShowPrintings(false) : fetchPrintings(selectedCard.name)}
                    style={{
                      background: showPrintings ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: showPrintings ? 'var(--color-blue)' : 'var(--color-muted)',
                      border: `1px solid ${showPrintings ? 'var(--color-blue)' : 'var(--color-border)'}`,
                      borderRadius: '7px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer',
                    }}>
                    {printingsLoading ? 'Loading…' : 'Change printing'}
                  </button>
                </div>
              </div>
              {/* Printings panel */}
              {showPrintings && (
                <div style={{ border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 0 10px 10px', background: 'var(--color-surface)', maxHeight: '260px', overflowY: 'auto' }}>
                  {printingsLoading ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-subtle)', padding: '14px', margin: 0, fontStyle: 'italic' }}>Loading printings…</p>
                  ) : printingResults.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-subtle)', padding: '14px', margin: 0 }}>No other printings found.</p>
                  ) : (
                    printingResults.map(card => <ScryfallResultRow key={card.id} card={card} onSelect={selectCard} />)
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtle)', pointerEvents: 'none' }}>
                  <SearchIcon />
                </div>
                <input type="text" placeholder="Search by card name…" value={cardQuery}
                  onChange={e => setCardQuery(e.target.value)} style={{ paddingLeft: '38px', paddingRight: '12px' }} />
                {searching && (
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtle)', fontSize: '12px' }}>Searching…</div>
                )}
              </div>
              {scryfallResults.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: '320px', overflowY: 'auto' }}>
                  {scryfallResults.map(card => <ScryfallResultRow key={card.id} card={card} onSelect={selectCard} />)}
                </div>
              )}
            </>
          )}
        </div>
      </FormSection>

      <FormSection title="2. Listing details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FieldLabel label="Condition" required>
            <select value={condition} onChange={e => setCondition(e.target.value as CardCondition)} required>
              {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </FieldLabel>

          <FieldLabel label="Foil">
            <button type="button" onClick={() => setIsFoil(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: '8px',
              border: `1px solid ${isFoil ? 'rgba(234,179,8,0.5)' : 'var(--color-border)'}`,
              background: isFoil ? 'rgba(234,179,8,0.08)' : 'transparent',
              color: isFoil ? '#fbbf24' : 'var(--color-muted)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease', width: 'fit-content',
            }}>
              <FoilStarIcon active={isFoil} />
              {isFoil ? <><CheckIcon size={13} color="currentColor" /> Foil</> : 'Non-foil'}
            </button>
          </FieldLabel>

          <FieldLabel label="Price (PHP)" required>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', fontSize: '14px', pointerEvents: 'none' }}>₱</span>
              <input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} required min="1" step="1" style={{ paddingLeft: '24px' }} />
            </div>
            {(() => {
              const base = isFoil
                ? (selectedCard?.prices?.usd_foil ?? selectedCard?.prices?.usd)
                : selectedCard?.prices?.usd
              return base ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0 }}>
                    TCGPlayer{isFoil ? ' foil' : ''}: <strong style={{ color: 'var(--color-text)' }}>${base} USD</strong> — suggest PHP:
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[30, 40, 50, 60, 70].map(rate => (
                      <button key={rate} type="button" onClick={() => applyMultiplier(rate)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-muted)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-blue)'; e.currentTarget.style.color = 'var(--color-blue)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-muted)' }}>
                        ×{rate} <span style={{ opacity: 0.7 }}>≈ ₱{Math.round(parseFloat(base) * rate).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            })()}
          </FieldLabel>

          <FieldLabel label="Quantity">
            <input type="number" placeholder="1" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" max="99" />
          </FieldLabel>
        </div>

        {/* Market overview */}
        {selectedCard && (() => {
          const allSortedMarket = [...marketListings].sort((a, b) => {
            if (marketSort === 'price_asc') return a.price - b.price
            if (marketSort === 'price_desc') return b.price - a.price
            if (marketSort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          const sortedMarket = marketSortPicked ? allSortedMarket : allSortedMarket.slice(0, 5)
          return (
            <div style={{ marginTop: '4px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Other sellers — {selectedCard.name}
                </p>
                {!marketLoading && marketListings.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {([['price_asc', '₱ Low→High'], ['price_desc', '₱ High→Low'], ['date_desc', 'Newest'], ['date_asc', 'Oldest']] as const).map(([val, label]) => (
                      <button key={val} type="button" onClick={() => { setMarketSort(val); setMarketSortPicked(true) }} style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                        border: `1px solid ${marketSort === val ? 'var(--color-blue)' : 'var(--color-border)'}`,
                        background: marketSort === val ? 'rgba(59,130,246,0.1)' : 'transparent',
                        color: marketSort === val ? 'var(--color-blue)' : 'var(--color-subtle)',
                      }}>{label}</button>
                    ))}
                  </div>
                )}
              </div>
              {marketLoading ? (
                <p style={{ fontSize: '12px', color: 'var(--color-subtle)', fontStyle: 'italic' }}>Loading…</p>
              ) : sortedMarket.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--color-subtle)', fontStyle: 'italic' }}>No other listings yet — be the first!</p>
              ) : (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Header row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 48px 44px 28px 64px 52px',
                    padding: '7px 14px', background: 'var(--color-surface-2)',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '10px', fontWeight: 700, color: 'var(--color-subtle)',
                    textTransform: 'uppercase', letterSpacing: '0.05em', gap: '8px',
                  }}>
                    <span>Seller</span>
                    <span>Printing</span>
                    <span>Cond.</span>
                    <span>Foil</span>
                    <span style={{ textAlign: 'right' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Price</span>
                    <span style={{ textAlign: 'right' }}>Listed</span>
                  </div>
                  {/* Data rows */}
                  {sortedMarket.map((row, i) => {
                    const sellerName = row.profiles?.display_name ?? row.profiles?.username ?? '—'
                    const sellerSlug = row.profiles?.username ?? null
                    return (
                      <div
                        key={row.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '100px 1fr 48px 44px 28px 64px 52px',
                          padding: '8px 14px', gap: '8px', alignItems: 'center',
                          borderBottom: i < sortedMarket.length - 1 ? '1px solid var(--color-border)' : 'none',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                          fontSize: '12px',
                        }}
                      >
                        {/* Seller */}
                        {sellerSlug ? (
                          <a href={`/profile/${sellerSlug}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: 'var(--color-blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}
                            title={sellerName}
                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                          >{sellerName}</a>
                        ) : (
                          <span style={{ color: 'var(--color-blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600 }}>{sellerName}</span>
                        )}
                        {/* Printing */}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                          <i className={`ss ss-${row.card_set.toLowerCase()} ss-${(row.card_rarity ?? 'common').toLowerCase()} ss-grad`} style={{ fontSize: '13px', flexShrink: 0 }} />
                          <span style={{ color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.card_set_name}>
                            {row.card_set_name}
                          </span>
                        </span>
                        {/* Condition */}
                        <span style={{ fontWeight: 600, fontSize: '11px', color: CONDITION_COLOR[row.condition as keyof typeof CONDITION_COLOR] ?? 'var(--color-muted)' }}>
                          {row.condition}
                        </span>
                        {/* Foil */}
                        <span style={{ fontSize: '11px', color: row.is_foil ? '#fbbf24' : 'var(--color-subtle)' }}>
                          {row.is_foil ? '✦ Foil' : '—'}
                        </span>
                        {/* Qty */}
                        <span style={{ textAlign: 'right', color: 'var(--color-muted)' }}>{row.quantity}</span>
                        {/* Price */}
                        <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-text)' }}>
                          ₱{row.price.toLocaleString('en-PH')}
                        </span>
                        {/* Listed */}
                        <span style={{ textAlign: 'right', fontSize: '10px', color: 'var(--color-subtle)' }} title={new Date(row.created_at).toLocaleDateString()}>
                          {row.created_at ? daysAgo(row.created_at) : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
              {!marketSortPicked && allSortedMarket.length > 5 && (
                <button type="button" onClick={() => setMarketSortPicked(true)}
                  style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-blue)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  Show all {allSortedMarket.length} listings
                </button>
              )}
            </div>
          )
        })()}

        <FieldLabel label="Notes (optional)">
          <textarea placeholder="Any extra details — foil, signed, language, etc." value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
        </FieldLabel>
      </FormSection>

      <FormSection title="3. Assign to binder">
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
          ⚠ Cards must be assigned to a binder to appear in search results.
        </div>
        <FieldLabel label="Binder">
          <select value={selectedBinderId ?? ''} onChange={e => {
            if (e.target.value === '__create__') { setCreatingBinder(true); setNewBinderName('') }
            else { setSelectedBinderId(e.target.value || null); setCreatingBinder(false) }
          }}>
            <option value="">No binder (hidden from search)</option>
            {binders.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            <option value="__create__">+ Create new binder…</option>
          </select>
        </FieldLabel>
        {creatingBinder && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              autoFocus
              placeholder="New binder name"
              value={newBinderName}
              onChange={e => setNewBinderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateBinder() } if (e.key === 'Escape') setCreatingBinder(false) }}
              style={{ flex: 1, fontSize: '13px' }}
            />
            <button type="button" onClick={handleCreateBinder} disabled={createBinderLoading || !newBinderName.trim()}
              style={{ padding: '6px 14px', borderRadius: '7px', background: 'var(--color-blue)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: (!newBinderName.trim() || createBinderLoading) ? 0.5 : 1 }}>
              {createBinderLoading ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => setCreatingBinder(false)}
              style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}
      </FormSection>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting || !selectedCard} style={{
        padding: '13px', background: (submitting || !selectedCard) ? 'var(--color-surface-2)' : 'var(--color-blue)',
        color: '#fff', fontWeight: 700, fontSize: '15px', borderRadius: '10px', border: 'none',
        opacity: (submitting || !selectedCard) ? 0.6 : 1, transition: 'background 0.15s, opacity 0.15s',
      }}>
        {submitting ? 'Creating listing…' : 'Publish listing'}
      </button>
    </form>
  )
}

/* ─── Bulk Import Form ────────────────────────────────────────────────── */

type BulkRow = {
  _key: string
  quantity: number
  cardName: string
  setCode: string
  collectorNumber: string
  // filled after Scryfall lookup
  scryfallId: string | null
  imageUri: string | null
  setName: string | null
  rarity: string | null
  typeLine: string | null
  manaCost: string | null
  usdPrice: string | null
  usdFoilPrice: string | null
  status: 'found' | 'not_found'
  // user editable
  condition: CardCondition
  isFoil: boolean
  price: string
}

function parseMoxfieldLine(line: string): { quantity: number; cardName: string; setCode: string; collectorNumber: string } | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  // Format: "1 Assassin's Trophy (ACR) 95"
  const match = trimmed.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)\s+(\S+)$/)
  if (!match) return null
  return {
    quantity: parseInt(match[1], 10),
    cardName: match[2].trim(),
    setCode: match[3].toLowerCase(),
    collectorNumber: match[4].trim(),
  }
}

function BulkImportForm({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const [rawText, setRawText] = useState('')
  const [rows, setRows] = useState<BulkRow[]>([])
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)

  // Global controls
  const [globalCondition, setGlobalCondition] = useState<CardCondition | ''>('')
  const [globalMultiplier, setGlobalMultiplier] = useState<number | null>(null)

  const [binders, setBinders] = useState<Binder[]>([])
  const [selectedBinderId, setSelectedBinderId] = useState<string | null>(null)
  const [creatingBinder, setCreatingBinder] = useState(false)
  const [newBinderName, setNewBinderName] = useState('')
  const [createBinderLoading, setCreateBinderLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successCount, setSuccessCount] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('binders').select('*').eq('user_id', userId).order('display_order')
      .then(({ data }) => { if (data) setBinders(data as Binder[]) })
  }, [userId])

  const handleCreateBinder = async () => {
    const name = newBinderName.trim()
    if (!name) return
    setCreateBinderLoading(true)
    const { data } = await supabase.from('binders')
      .insert({ user_id: userId, name, display_order: binders.length })
      .select().single()
    if (data) {
      setBinders(prev => [...prev, data as Binder])
      setSelectedBinderId((data as Binder).id)
    }
    setCreatingBinder(false)
    setNewBinderName('')
    setCreateBinderLoading(false)
  }

  const handleParse = async () => {
    setParseError('')
    const lines = rawText.split('\n').filter(l => l.trim())
    if (lines.length === 0) { setParseError('Paste at least one card line.'); return }
    if (lines.length > 100) { setParseError('Maximum 100 cards per import.'); return }

    const parsed = lines.map(l => parseMoxfieldLine(l)).filter(Boolean) as ReturnType<typeof parseMoxfieldLine>[]
    const failed = lines.length - parsed.length
    if (parsed.length === 0) { setParseError('Could not parse any lines. Check the format.'); return }

    setParsing(true)
    setIsPreviewing(false)

    // Batch lookup via Scryfall collection API
    const identifiers = parsed.map(p => ({ set: p!.setCode, collector_number: p!.collectorNumber }))

    let scryfallMap: Record<string, ScryfallCard> = {}
    try {
      const res = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers }),
      })
      const data = await res.json()
      if (data.data) {
        for (const card of data.data as ScryfallCard[]) {
          const key = `${card.set.toLowerCase()}_${card.collector_number}`
          scryfallMap[key] = card
        }
      }
    } catch {
      setParseError('Failed to reach Scryfall. Check your connection and try again.')
      setParsing(false)
      return
    }

    const newRows: BulkRow[] = parsed.map((p, i) => {
      const key = `${p!.setCode}_${p!.collectorNumber}`
      const card = scryfallMap[key] ?? null
      return {
        _key: `${i}_${p!.setCode}_${p!.collectorNumber}`,
        quantity: p!.quantity,
        cardName: card?.name ?? p!.cardName,
        setCode: p!.setCode,
        collectorNumber: p!.collectorNumber,
        scryfallId: card?.id ?? null,
        imageUri: card ? (card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null) : null,
        setName: card?.set_name ?? null,
        rarity: card?.rarity ?? null,
        typeLine: card?.type_line ?? null,
        manaCost: card?.mana_cost ?? null,
        usdPrice: card?.prices?.usd ?? null,
        usdFoilPrice: card?.prices?.usd_foil ?? null,
        status: card ? 'found' : 'not_found',
        condition: 'NM',
        isFoil: false,
        price: card?.prices?.usd ? String(Math.round(parseFloat(card.prices.usd) * 40)) : '',
      }
    })

    setRows(newRows)
    setParsing(false)
    setIsPreviewing(true)
    if (failed > 0) setParseError(`${failed} line${failed > 1 ? 's' : ''} could not be parsed and were skipped.`)
  }

  const updateRow = (key: string, patch: Partial<BulkRow>) => {
    setRows(prev => prev.map(r => r._key === key ? { ...r, ...patch } : r))
  }

  const removeRow = (key: string) => {
    setRows(prev => prev.filter(r => r._key !== key))
  }

  const applyGlobalCondition = (c: CardCondition) => {
    setGlobalCondition(c)
    setRows(prev => prev.map(r => ({ ...r, condition: c })))
  }

  const applyGlobalMultiplier = (rate: number) => {
    setGlobalMultiplier(rate)
    setRows(prev => prev.map(r => {
      const base = r.isFoil ? (r.usdFoilPrice ?? r.usdPrice) : r.usdPrice
      if (!base) return r
      return { ...r, price: String(Math.round(parseFloat(base) * rate)) }
    }))
  }

  const applyGlobalFoil = (foil: boolean) => {
    setRows(prev => prev.map(r => {
      const base = foil ? (r.usdFoilPrice ?? r.usdPrice) : r.usdPrice
      const newPrice = base && globalMultiplier
        ? String(Math.round(parseFloat(base) * globalMultiplier))
        : r.price
      return { ...r, isFoil: foil, price: newPrice }
    }))
  }

  const foundRows = rows.filter(r => r.status === 'found')
  const notFoundRows = rows.filter(r => r.status === 'not_found')
  const readyCount = foundRows.filter(r => r.price && parseInt(r.price) > 0).length

  const handleSubmit = async () => {
    setSubmitError('')
    const toProcess = foundRows.filter(r => r.price && parseInt(r.price) > 0)
    if (toProcess.length === 0) { setSubmitError('No valid listings to submit.'); return }

    setSubmitting(true)
    try {
      // Fetch existing listed listings for this user so we can detect duplicates
      const { data: existingListings } = await supabase
        .from('listings')
        .select('id, card_id, condition, is_foil, price, quantity')
        .eq('user_id', userId)
        .eq('status', 'listed')

      const existing = existingListings ?? []

      // First, collapse any duplicates within the bulk import itself
      const collapsed = new Map<string, typeof toProcess[0] & { quantity: number }>()
      for (const r of toProcess) {
        const key = `${r.scryfallId}|${r.condition}|${r.isFoil}|${parseInt(r.price, 10)}`
        const prev = collapsed.get(key)
        if (prev) {
          prev.quantity += r.quantity
        } else {
          collapsed.set(key, { ...r, quantity: r.quantity })
        }
      }

      const toUpdate: { id: string; newQty: number }[] = []
      const toInsert: typeof toProcess = []

      for (const r of collapsed.values()) {
        const match = existing.find(e =>
          e.card_id    === r.scryfallId &&
          e.condition  === r.condition  &&
          e.is_foil    === r.isFoil     &&
          e.price      === parseInt(r.price, 10)
        )
        if (match) {
          toUpdate.push({ id: match.id, newQty: match.quantity + r.quantity })
        } else {
          toInsert.push(r)
        }
      }

      // Apply updates
      await Promise.all(
        toUpdate.map(({ id, newQty }) =>
          supabase.from('listings').update({ quantity: newQty }).eq('id', id)
        )
      )

      // Apply inserts
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from('listings').insert(
          toInsert.map(r => ({
            user_id: userId,
            card_id: r.scryfallId,
            card_name: r.cardName,
            card_set: r.setCode,
            card_set_name: r.setName,
            card_image_uri: r.imageUri,
            card_rarity: r.rarity,
            card_mana_cost: r.manaCost,
            card_type: r.typeLine,
            condition: r.condition,
            is_foil: r.isFoil,
            price: parseInt(r.price, 10),
            quantity: r.quantity,
            notes: null,
            usd_price: r.isFoil
              ? parseFloat(r.usdFoilPrice ?? r.usdPrice ?? '0') || null
              : parseFloat(r.usdPrice ?? '0') || null,
            binder_id: selectedBinderId,
          }))
        )
        if (insertError) { setSubmitError(insertError.message); setSubmitting(false); return }
      }

      setSuccessCount(toProcess.length)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  if (successCount !== null) {
    return (
      <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckIcon size={24} color="#22c55e" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text)' }}>
          {successCount} listing{successCount !== 1 ? 's' : ''} created!
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '28px' }}>
          Your cards are now live on the marketplace.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => { setSuccessCount(null); setRawText(''); setRows([]); setIsPreviewing(false) }}
            style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '14px', fontWeight: 500 }}>
            Import more
          </button>
          <button onClick={() => router.push('/my-listings')}
            style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-blue)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            My listings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Paste area */}
      {!isPreviewing && (
        <FormSection title="Paste your Moxfield list">
          <p style={{ fontSize: '12px', color: 'var(--color-subtle)', marginTop: '-8px' }}>
            One card per line · Format: <code style={{ background: 'var(--color-surface-2)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>1 Assassin's Trophy (ACR) 95</code>
          </p>
          <textarea
            placeholder={'1 Assassin\'s Trophy (ACR) 95\n1 Birds of Paradise (M10) 168\n4 Lightning Bolt (M11) 149'}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={10}
            style={{ fontFamily: 'monospace', fontSize: '13px', resize: 'vertical', lineHeight: 1.7 }}
          />
          {parseError && (
            <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{parseError}</p>
          )}
          <button
            onClick={handleParse}
            disabled={parsing || !rawText.trim()}
            style={{
              padding: '11px 20px', background: (!rawText.trim() || parsing) ? 'var(--color-surface-2)' : 'var(--color-blue)',
              color: '#fff', fontWeight: 700, fontSize: '14px', borderRadius: '9px', border: 'none',
              cursor: (!rawText.trim() || parsing) ? 'not-allowed' : 'pointer',
              opacity: (!rawText.trim() || parsing) ? 0.6 : 1,
              alignSelf: 'flex-start',
            }}
          >
            {parsing ? 'Looking up cards…' : 'Preview listings'}
          </button>
        </FormSection>
      )}

      {/* Preview */}
      {isPreviewing && rows.length > 0 && (
        <>
          {/* Global controls */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Set all conditions:</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {CONDITION_SHORT.map(c => (
                  <button key={c.value} onClick={() => applyGlobalCondition(c.value)} style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    border: `1px solid ${globalCondition === c.value ? 'var(--color-blue)' : 'var(--color-border)'}`,
                    background: globalCondition === c.value ? 'var(--color-blue-glow)' : 'transparent',
                    color: globalCondition === c.value ? 'var(--color-blue)' : 'var(--color-muted)',
                    cursor: 'pointer', transition: 'all 0.12s ease',
                  }}>{c.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Apply multiplier:</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[30, 40, 50, 60, 70].map(rate => (
                  <button key={rate} onClick={() => applyGlobalMultiplier(rate)} style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    border: `1px solid ${globalMultiplier === rate ? 'var(--color-blue)' : 'var(--color-border)'}`,
                    background: globalMultiplier === rate ? 'var(--color-blue-glow)' : 'transparent',
                    color: globalMultiplier === rate ? 'var(--color-blue)' : 'var(--color-muted)',
                    cursor: 'pointer', transition: 'all 0.12s ease',
                  }}>×{rate}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Set all foil:</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[{ label: 'Non-foil', value: false }, { label: 'Foil', value: true }].map(opt => (
                  <button key={String(opt.value)} onClick={() => applyGlobalFoil(opt.value)} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    border: `1px solid ${opt.value ? 'rgba(234,179,8,0.4)' : 'var(--color-border)'}`,
                    background: opt.value ? 'rgba(234,179,8,0.08)' : 'transparent',
                    color: opt.value ? '#fbbf24' : 'var(--color-muted)',
                    cursor: 'pointer', transition: 'all 0.12s ease',
                  }}>
                    {opt.value && <FoilStarIcon active />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { setIsPreviewing(false); setParseError('') }} style={{
              marginLeft: 'auto', padding: '5px 12px', borderRadius: '7px', background: 'transparent',
              border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: '12px', cursor: 'pointer',
            }}>
              ← Edit list
            </button>
          </div>

          {/* Not found warning */}
          {notFoundRows.length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', color: '#fbbf24', fontSize: '13px' }}>
              ⚠ {notFoundRows.length} card{notFoundRows.length > 1 ? 's' : ''} not found on Scryfall and will be skipped:
              {' '}{notFoundRows.map(r => `${r.cardName} (${r.setCode.toUpperCase()}) #${r.collectorNumber}`).join(', ')}
            </div>
          )}
          {parseError && (
            <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{parseError}</p>
          )}

          {/* Card rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rows.map(row => (
              <BulkRowCard
                key={row._key}
                row={row}
                onChange={patch => updateRow(row._key, patch)}
                onRemove={() => removeRow(row._key)}
              />
            ))}
          </div>

          {/* Binder assignment */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#fbbf24', fontSize: '13px' }}>
              ⚠ Cards must be assigned to a binder to appear in search results.
            </div>
            <FieldLabel label="Assign all to binder">
              <select value={selectedBinderId ?? ''} onChange={e => {
                if (e.target.value === '__create__') { setCreatingBinder(true); setNewBinderName('') }
                else { setSelectedBinderId(e.target.value || null); setCreatingBinder(false) }
              }} style={{ maxWidth: '320px' }}>
                <option value="">No binder (hidden from search)</option>
                {binders.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                <option value="__create__">+ Create new binder…</option>
              </select>
            </FieldLabel>
            {creatingBinder && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  autoFocus
                  placeholder="New binder name"
                  value={newBinderName}
                  onChange={e => setNewBinderName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateBinder() } if (e.key === 'Escape') setCreatingBinder(false) }}
                  style={{ flex: 1, fontSize: '13px', maxWidth: '320px' }}
                />
                <button type="button" onClick={handleCreateBinder} disabled={createBinderLoading || !newBinderName.trim()}
                  style={{ padding: '6px 14px', borderRadius: '7px', background: 'var(--color-blue)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: (!newBinderName.trim() || createBinderLoading) ? 0.5 : 1 }}>
                  {createBinderLoading ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={() => setCreatingBinder(false)}
                  style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: '13px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          {submitError && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '13px' }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || readyCount === 0}
              style={{
                padding: '12px 24px', background: (submitting || readyCount === 0) ? 'var(--color-surface-2)' : 'var(--color-blue)',
                color: '#fff', fontWeight: 700, fontSize: '14px', borderRadius: '9px', border: 'none',
                cursor: (submitting || readyCount === 0) ? 'not-allowed' : 'pointer',
                opacity: (submitting || readyCount === 0) ? 0.6 : 1,
              }}
            >
              {submitting ? 'Creating listings…' : `Publish ${readyCount} listing${readyCount !== 1 ? 's' : ''}`}
            </button>
            <p style={{ fontSize: '12px', color: 'var(--color-subtle)' }}>
              {foundRows.length - readyCount > 0 && `${foundRows.length - readyCount} missing a price and will be skipped`}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Bulk Row Card ───────────────────────────────────────────────────── */

type BulkPrinting = {
  id: string
  set: string
  set_name: string
  collector_number: string
  image_uri: string | null
  rarity: string
  usd: string | null
  usd_foil: string | null
}

function BulkRowCard({ row, onChange, onRemove }: {
  row: BulkRow
  onChange: (patch: Partial<BulkRow>) => void
  onRemove: () => void
}) {
  const isNotFound = row.status === 'not_found'

  const { onMouseMove: onImgMove, onMouseLeave: onImgLeave, preview: imgPreview } = useCardHover(
    row.imageUri,
  )

  const [showPrintings, setShowPrintings] = useState(false)
  const [printings, setPrintings] = useState<BulkPrinting[]>([])
  const [printingsLoading, setPrintingsLoading] = useState(false)
  const printingsFetched = useRef(false)

  const openPrintings = async () => {
    setShowPrintings(v => !v)
    if (printingsFetched.current) return
    printingsFetched.current = true
    setPrintingsLoading(true)
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(row.cardName)}"&unique=prints&order=released`
      )
      const data = await res.json()
      if (data.data) {
        const opts: BulkPrinting[] = (data.data as ScryfallCard[]).map(c => ({
          id: c.id,
          set: c.set,
          set_name: c.set_name,
          collector_number: c.collector_number,
          image_uri: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? null,
          rarity: c.rarity,
          usd: c.prices?.usd ?? null,
          usd_foil: c.prices?.usd_foil ?? null,
        }))
        setPrintings(opts)
      }
    } catch { /* silently fail */ }
    setPrintingsLoading(false)
  }

  const selectPrinting = (p: BulkPrinting) => {
    const base = row.isFoil ? (p.usd_foil ?? p.usd) : p.usd
    onChange({
      scryfallId: p.id,
      setCode: p.set,
      setName: p.set_name,
      collectorNumber: p.collector_number,
      imageUri: p.image_uri,
      rarity: p.rarity,
      usdPrice: p.usd,
      usdFoilPrice: p.usd_foil,
      price: base ? String(Math.round(parseFloat(base) * 40)) : row.price,
    })
    setShowPrintings(false)
  }

  const applyMultiplier = (rate: number) => {
    const base = row.isFoil ? (row.usdFoilPrice ?? row.usdPrice) : row.usdPrice
    if (!base) return
    onChange({ price: String(Math.round(parseFloat(base) * rate)) })
  }

  const toggleFoil = () => {
    const newFoil = !row.isFoil
    const base = newFoil ? (row.usdFoilPrice ?? row.usdPrice) : row.usdPrice
    const newPrice = base ? String(Math.round(parseFloat(base) * 40)) : row.price
    onChange({ isFoil: newFoil, price: newPrice })
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${isNotFound ? 'rgba(234,179,8,0.25)' : 'var(--color-border)'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      opacity: isNotFound ? 0.6 : 1,
    }}>
      {/* Main row */}
      <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>

        {/* Card image — full aspect ratio */}
        <div
          onMouseMove={onImgMove}
          onMouseLeave={onImgLeave}
          style={{
            width: '90px',
            flexShrink: 0,
            background: 'var(--color-surface-2)',
            borderRight: '1px solid var(--color-border)',
          }}
        >
          {imgPreview}
          {row.imageUri ? (
            <img
              src={row.imageUri}
              alt={row.cardName}
              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardIcon />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>

          {/* Top: name + remove */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: isNotFound ? 'var(--color-muted)' : 'var(--color-text)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.cardName}
                {isNotFound && <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '8px', fontWeight: 500 }}>not found — will be skipped</span>}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                {row.setCode && <i className={`ss ss-${row.setCode.toLowerCase()} ss-${(row.rarity ?? 'common').toLowerCase()} ss-grad`} style={{ fontSize: '14px', flexShrink: 0 }} />}
                {row.setName ?? row.setCode.toUpperCase()}
                <span style={{ color: 'var(--color-subtle)' }}> · {row.setCode.toUpperCase()} #{row.collectorNumber}</span>
                {row.usdPrice && <span style={{ color: 'var(--color-subtle)' }}> · <span style={{ color: 'var(--color-muted)' }}>${row.usdPrice} USD</span></span>}
              </p>
            </div>
            <button onClick={onRemove} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
              background: 'transparent', border: '1px solid var(--color-border)',
              color: 'var(--color-subtle)', cursor: 'pointer', transition: 'all 0.12s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-subtle)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)' }}
            >
              <XIcon />
            </button>
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Condition */}
            <select
              value={row.condition}
              onChange={e => onChange({ condition: e.target.value as CardCondition })}
              disabled={isNotFound}
              style={{ padding: '6px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: isNotFound ? 'not-allowed' : 'pointer' }}
            >
              {CONDITION_SHORT.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '7px', overflow: 'hidden' }}>
              <span style={{ padding: '0 8px', fontSize: '13px', color: 'var(--color-muted)', borderRight: '1px solid var(--color-border)' }}>₱</span>
              <input
                type="number"
                value={row.price}
                onChange={e => onChange({ price: e.target.value })}
                disabled={isNotFound}
                min="1"
                step="1"
                placeholder="0"
                style={{ border: 'none', borderRadius: 0, padding: '7px 8px', fontSize: '13px', fontWeight: 700, background: 'transparent', width: '80px' }}
              />
            </div>

            {/* Multiplier buttons */}
            {row.usdPrice && !isNotFound && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {[30, 40, 50, 60, 70].map(rate => (
                  <button key={rate} onClick={() => applyMultiplier(rate)} style={{
                    padding: '5px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                    border: '1px solid var(--color-border)', background: 'transparent',
                    color: 'var(--color-muted)', cursor: 'pointer', transition: 'all 0.12s ease',
                    whiteSpace: 'nowrap',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-blue)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-blue)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)' }}
                  >
                    ×{rate} <span style={{ opacity: 0.65 }}>₱{Math.round(parseFloat(row.usdPrice!) * rate).toLocaleString('en-PH')}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Foil toggle */}
            {!isNotFound && (
              <button onClick={toggleFoil} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                border: `1px solid ${row.isFoil ? 'rgba(234,179,8,0.45)' : 'var(--color-border)'}`,
                background: row.isFoil ? 'rgba(234,179,8,0.08)' : 'transparent',
                color: row.isFoil ? '#fbbf24' : 'var(--color-muted)',
                cursor: 'pointer', transition: 'all 0.12s ease',
              }}>
                <FoilStarIcon active={row.isFoil} />
                {row.isFoil ? 'Foil' : 'Foil'}
              </button>
            )}

            {/* Qty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-subtle)' }}>Qty</span>
              <input
                type="number"
                value={row.quantity}
                onChange={e => onChange({ quantity: parseInt(e.target.value) || 1 })}
                disabled={isNotFound}
                min="1"
                step="1"
                style={{ width: '52px', padding: '6px 8px', fontSize: '13px', fontWeight: 600, textAlign: 'center', borderRadius: '7px' }}
              />
            </div>
          </div>

          {/* Change printing toggle */}
          {!isNotFound && (
            <button onClick={openPrintings} style={{
              alignSelf: 'flex-start',
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
              background: showPrintings ? 'var(--color-blue-glow)' : 'transparent',
              border: `1px solid ${showPrintings ? 'rgba(59,130,246,0.35)' : 'var(--color-border)'}`,
              color: showPrintings ? 'var(--color-blue)' : 'var(--color-muted)',
              cursor: 'pointer', transition: 'all 0.12s ease',
            }}>
              <PrintingIcon />
              Change printing
              <span style={{ opacity: 0.6, fontSize: '10px' }}>{showPrintings ? '▲' : '▼'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Printing picker — expands inline */}
      {showPrintings && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '14px 16px', background: 'var(--color-surface-2)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Select a printing
          </p>
          {printingsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '8px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '6px' }} />
              ))}
            </div>
          ) : printings.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No printings found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '2px' }}>
              {printings.map(p => {
                const isSelected = p.id === row.scryfallId
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPrinting(p)}
                    title={`${p.set_name} (${p.set.toUpperCase()}) #${p.collector_number}${p.usd ? ` · $${p.usd}` : ''}`}
                    style={{
                      padding: 0, border: `2px solid ${isSelected ? 'var(--color-blue)' : 'transparent'}`,
                      borderRadius: '7px', overflow: 'hidden',
                      background: isSelected ? 'var(--color-blue-glow)' : 'var(--color-surface)',
                      cursor: 'pointer', outline: 'none',
                      boxShadow: isSelected ? '0 0 0 1px rgba(59,130,246,0.3)' : 'none',
                      transition: 'border-color 0.12s ease',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    {p.image_uri ? (
                      <HoverCardImage src={p.image_uri} alt={p.set_name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CardIcon />
                      </div>
                    )}
                    <div style={{ padding: '2px 3px', textAlign: 'center' }}>
                      <p style={{ fontSize: '9px', fontWeight: 700, color: isSelected ? 'var(--color-blue)' : 'var(--color-muted)', textTransform: 'uppercase', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <i className={`ss ss-${p.set.toLowerCase()} ss-${p.rarity.toLowerCase()} ss-grad`} style={{ fontSize: '12px', flexShrink: 0 }} />
                        {p.set.toUpperCase()}
                      </p>
                      {p.usd && (
                        <p style={{ fontSize: '9px', color: 'var(--color-subtle)', margin: 0 }}>${p.usd}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {!printingsLoading && printings.length > 0 && (
            <p style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              Current: {row.setCode && <i className={`ss ss-${row.setCode.toLowerCase()} ss-${(row.rarity ?? 'common').toLowerCase()} ss-grad`} style={{ fontSize: '13px', flexShrink: 0 }} />}<span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{row.setName ?? row.setCode.toUpperCase()}</span>
              <span style={{ color: 'var(--color-subtle)' }}> · #{row.collectorNumber}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Scryfall Result Row ─────────────────────────────────────────────── */
function ScryfallResultRow({ card, onSelect }: { card: ScryfallCard; onSelect: (c: ScryfallCard) => void }) {
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
          <img src={thumb} alt={card.name} style={{ width: '36px', borderRadius: '4px', flexShrink: 0 }} onMouseMove={onImgMove} onMouseLeave={onImgLeave} />
        </>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</p>
        <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className={`ss ss-${card.set.toLowerCase()} ss-${card.rarity.toLowerCase()} ss-grad`} style={{ fontSize: '13px', flexShrink: 0 }} />
          {card.set_name} · {card.set.toUpperCase()} · <span style={{ textTransform: 'capitalize' }}>{card.rarity}</span>
        </p>
      </div>
      {card.prices?.usd && <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', flexShrink: 0 }}>${card.prices.usd}</span>}
    </button>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function PageShell({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 1.5rem 80px' }}>{children}</div>
}
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px 24px' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '16px', letterSpacing: '0.03em' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
    </div>
  )
}
function FieldLabel({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.03em' }}>
        {label}{required && <span style={{ color: 'var(--color-blue)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
function LoadingState() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', color: 'var(--color-muted)', fontSize: '14px' }}>Loading…</div>
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function CheckIcon({ size = 24, color = '#22c55e' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>
}
function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function CardIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-subtle)' }}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18" /></svg>
}
function PrintingIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
}
function FoilStarIcon({ active }: { active: boolean }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill={active ? '#fbbf24' : 'none'} stroke={active ? '#fbbf24' : 'currentColor'} strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
}

'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import confetti from 'canvas-confetti'
import { ManaIcon, binderTabStyle, type ManaColor } from '@/components/ManaIcon'
import BinderCustomizePanel from '@/components/BinderCustomizePanel'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Listing, CardCondition, ScryfallCard, Binder } from '@/types'
import { useCardHover, HoverCardImage } from '@/components/CardHoverPreview'
import { formatDate } from '@/lib/utils'

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'most_viewed' | 'alpha'
type ListingStatus = 'listed' | 'unlisted' | 'sold'

const CONDITIONS: CardCondition[] = ['NM', 'LP', 'MP', 'HP', 'DMG']
const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
}
const CONDITION_COLORS: Record<CardCondition, string> = {
  NM: 'var(--color-nm)',
  LP: 'var(--color-lp)',
  MP: 'var(--color-mp)',
  HP: 'var(--color-hp)',
  DMG: 'var(--color-dmg)',
}

const STATUS_LABELS: Record<ListingStatus, string> = {
  listed: 'Listed',
  unlisted: 'Unlisted',
  sold: 'Sold',
}

const BULK_ACTIONS: Record<ListingStatus, ListingStatus[]> = {
  listed:   ['unlisted', 'sold'],
  unlisted: ['listed',   'sold'],
  sold:     ['listed', 'unlisted'],
}


/* ─── Page ────────────────────────────────────────────────────────────── */

function MyListingsContent() {
  const supabase = createClient()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('price_desc')
  const [conditions, setConditions] = useState<Set<CardCondition>>(new Set())
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [allListings, setAllListings] = useState<Listing[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Status tabs + bulk selection
  const [activeTab, setActiveTab] = useState<ListingStatus>('unlisted') // default binder is Unsorted, which only shows unlisted
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  // Dashboard period
  type DashPeriod = 'today' | 'week' | 'month' | 'lifetime'
  const [dashPeriod, setDashPeriod] = useState<DashPeriod>('lifetime')

  // Binders
  const [binders, setBinders] = useState<Binder[]>([])
  const [selectedBinderId, setSelectedBinderId] = useState<string | 'unsorted'>('unsorted')
  const [renamingBinderId, setRenamingBinderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [editingDescId, setEditingDescId] = useState<string | null>(null)
  const [descValue, setDescValue] = useState('')
  const [confirmDeleteBinderId, setConfirmDeleteBinderId] = useState<string | null>(null)
  const [deletingBinderId, setDeletingBinderId] = useState<string | null>(null)
  const [binderEditMode, setBinderEditMode] = useState(false)
  const saveColorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auth guard
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/auth/login?redirect=/my-listings')
      } else {
        setUserId(data.user.id)
      }
    })
  }, [])

  // Fetch + auto-create binders
  useEffect(() => {
    if (!userId) return
    const init = async () => {
      const { data: existing } = await supabase
        .from('binders').select('*').eq('user_id', userId).order('display_order')
      if (existing && existing.length > 0) {
        setBinders(existing as Binder[])
      } else {
        const defaults = [
          { user_id: userId, name: 'Binder 1', display_order: 0 },
          { user_id: userId, name: 'Binder 2', display_order: 1 },
          { user_id: userId, name: 'Binder 3', display_order: 2 },
        ]
        const { data: created } = await supabase.from('binders').insert(defaults).select()
        if (created) setBinders(created as Binder[])
      }
    }
    init()
  }, [userId])

  const handleAddBinder = async () => {
    if (!userId) return
    const display_order = binders.length
    const { data } = await supabase
      .from('binders')
      .insert({ user_id: userId, name: `Binder ${binders.length + 1}`, display_order })
      .select().single()
    if (data) {
      setBinders(prev => [...prev, data as Binder])
      setSelectedBinderId((data as Binder).id)
    }
  }

  const handleRenameBinder = async (id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await supabase.from('binders').update({ name: trimmed }).eq('id', id)
    setBinders(prev => prev.map(b => b.id === id ? { ...b, name: trimmed } : b))
    setRenamingBinderId(null)
  }

  const handleDeleteBinder = async (id: string) => {
    setDeletingBinderId(id)
    await supabase.from('listings').delete().eq('binder_id', id)
    await supabase.from('binders').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.binder_id !== id))
    setAllListings(prev => prev.filter(l => l.binder_id !== id))
    setBinders(prev => prev.filter(b => b.id !== id))
    setConfirmDeleteBinderId(null)
    setDeletingBinderId(null)
    setSelectedBinderId('unsorted')
  }

  const handleBinderColorChange = (id: string, field: 'color1' | 'color2' | 'text_color', value: string) => {
    setBinders(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
    if (saveColorTimer.current) clearTimeout(saveColorTimer.current)
    saveColorTimer.current = setTimeout(() => {
      supabase.from('binders').update({ [field]: value }).eq('id', id)
    }, 400)
  }

  const clearBinderColor = async (id: string, field: 'color1' | 'color2' | 'text_color') => {
    const updates: Record<string, null> = { [field]: null }
    if (field === 'color1') updates.color2 = null        // can't have gradient without start colour
    setBinders(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
    await supabase.from('binders').update(updates).eq('id', id)
  }

  const toggleManaPip = async (binderId: string, color: ManaColor) => {
    const binder = binders.find(b => b.id === binderId)
    if (!binder) return
    const current = binder.mana_colors ?? []
    const next = current.includes(color)
      ? current.filter(c => c !== color)
      : current.length < 5 ? [...current, color] : current
    if (next === current) return
    setBinders(prev => prev.map(b => b.id === binderId ? { ...b, mana_colors: next } : b))
    await supabase.from('binders').update({ mana_colors: next }).eq('id', binderId)
  }

  const resetBinderStyle = async (id: string) => {
    const updates = { color1: null, color2: null, text_color: null, mana_colors: [] }
    setBinders(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
    await supabase.from('binders').update(updates).eq('id', id)
  }

  const handleDescribeBinder = async (id: string, description: string) => {
    const trimmed = description.trim() || null
    await supabase.from('binders').update({ description: trimmed }).eq('id', id)
    setBinders(prev => prev.map(b => b.id === id ? { ...b, description: trimmed } : b))
    setEditingDescId(null)
  }

  const handleMoveToBinder = async (ids: string[], binderId: string | null) => {
    setBulkLoading(true)
    await supabase.from('listings').update({ binder_id: binderId }).in('id', ids)
    setListings(prev => prev.map(l => ids.includes(l.id) ? { ...l, binder_id: binderId } : l))
    setAllListings(prev => prev.map(l => ids.includes(l.id) ? { ...l, binder_id: binderId } : l))
    setSelectedIds(new Set())
    setBulkLoading(false)
  }

  // Fetch ALL listings (all statuses), filter client-side for instant tab switching
  const fetchListings = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    let q = supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)

    if (query.trim()) q = q.ilike('card_name', `%${query.trim()}%`)
    if (conditions.size > 0) q = q.in('condition', Array.from(conditions))
    if (minPrice) q = q.gte('price', parseFloat(minPrice))
    if (maxPrice) q = q.lte('price', parseFloat(maxPrice))

    switch (sort) {
      case 'newest':      q = q.order('created_at', { ascending: false }); break
      case 'oldest':      q = q.order('created_at', { ascending: true });  break
      case 'price_asc':   q = q.order('price', { ascending: true });       break
      case 'price_desc':  q = q.order('price', { ascending: false });      break
      case 'most_viewed': q = q.order('views', { ascending: false });      break
      case 'alpha':       q = q.order('card_name', { ascending: true });   break
    }

    const { data } = await q
    setListings((data as Listing[]) ?? [])
    setLoading(false)
  }, [userId, query, sort, conditions, minPrice, maxPrice])

  // Fetch ALL listings unfiltered — used by dashboard so search bar doesn't affect stats
  const fetchAllListings = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
    setAllListings((data as Listing[]) ?? [])
  }, [userId])

  useEffect(() => {
    if (userId) fetchListings()
  }, [fetchListings, userId])

  useEffect(() => {
    if (userId) fetchAllListings()
  }, [fetchAllListings, userId])

  // Computed — filter by selected binder first, then by status
  const binderListings = useMemo(() =>
    selectedBinderId === 'unsorted'
      ? listings.filter(l => !l.binder_id)
      : listings.filter(l => l.binder_id === selectedBinderId),
    [listings, selectedBinderId]
  )

  const tabCounts = useMemo(() => ({
    listed:   binderListings.filter(l => (l.status ?? 'listed') === 'listed').length,
    unlisted: binderListings.filter(l => l.status === 'unlisted').length,
    sold:     binderListings.filter(l => l.status === 'sold').length,
  }), [binderListings])

  const displayedListings = useMemo(() =>
    binderListings.filter(l => (l.status ?? 'listed') === activeTab),
    [binderListings, activeTab]
  )

  const allSelected = selectedIds.size > 0 && selectedIds.size === displayedListings.length
  const someSelected = selectedIds.size > 0 && !allSelected

  const toggleCondition = (c: CardCondition) => {
    setConditions(prev => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  const switchTab = (tab: ListingStatus) => {
    setActiveTab(tab)
    setSelectedIds(new Set())
    setEditingId(null)
    setConfirmDeleteId(null)
    setConfirmBulkDelete(false)
  }

  const switchBinder = (id: string | 'unsorted') => {
    setSelectedBinderId(id)
    setSelectedIds(new Set())
    setEditingId(null)
    setConfirmDeleteId(null)
    setConfirmBulkDelete(false)
    setActiveTab(id === 'unsorted' ? 'unlisted' : 'listed')
    setBinderEditMode(false)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected || someSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayedListings.map(l => l.id)))
    }
  }

  // Update status for a set of ids (single or bulk)
  const handleStatusChange = useCallback(async (ids: string[], newStatus: ListingStatus) => {
    setBulkLoading(true)
    await supabase.from('listings').update({ status: newStatus }).in('id', ids)
    setListings(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: newStatus } : l))
    setAllListings(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: newStatus } : l))
    setSelectedIds(new Set())
    setBulkLoading(false)
    if (newStatus === 'sold') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'] })
    }
  }, [supabase])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setAllListings(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    setBulkLoading(true)
    await supabase.from('listings').delete().in('id', ids)
    setListings(prev => prev.filter(l => !ids.includes(l.id)))
    setAllListings(prev => prev.filter(l => !ids.includes(l.id)))
    setSelectedIds(new Set())
    setConfirmBulkDelete(false)
    setBulkLoading(false)
  }

  const handleSave = (updated: Listing) => {
    setListings(prev => prev.map(l => l.id === updated.id ? updated : l))
    setAllListings(prev => prev.map(l => l.id === updated.id ? updated : l))
    setEditingId(null)
  }

  const activeFilterCount = conditions.size + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)

  const dashStats = useMemo(() => {
    const now = Date.now()
    const cutoff: Record<string, number> = {
      today:    now - 1 * 24 * 60 * 60 * 1000,
      week:     now - 7 * 24 * 60 * 60 * 1000,
      month:    now - 30 * 24 * 60 * 60 * 1000,
      lifetime: 0,
    }
    const since = cutoff[dashPeriod]
    // Use allListings (unfiltered) so the search bar never affects these stats
    const periodFiltered = allListings.filter(l => new Date(l.created_at).getTime() >= since)
    const listed = periodFiltered.filter(l => (l.status ?? 'listed') === 'listed')
    const sold   = periodFiltered.filter(l => l.status === 'sold')
    return {
      totalListed:  listed.length,
      totalSold:    sold.length,
      // Total value = ALL cards (listed + unlisted + sold) so that when all cards are sold, totalValue === amountEarned
      totalValue:   periodFiltered.reduce((s, l) => s + l.price * l.quantity, 0),
      amountEarned: sold.reduce((s, l) => s + l.price * l.quantity, 0),
    }
  }, [allListings, dashPeriod])

  if (!userId && !loading) return null

  return (
    <div className="page-wrap" style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 1.5rem 120px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            My Listings
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Manage the cards you have listed for sale
          </p>
        </div>
        <Link href="/sell" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '10px 16px', background: 'var(--color-blue)', color: '#fff',
          borderRadius: '9px', fontSize: '13px', fontWeight: 600,
          textDecoration: 'none', flexShrink: 0,
        }}>
          <PlusIcon /> New listing
        </Link>
      </div>

      {/* Seller Dashboard */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '14px', padding: '18px 20px', marginBottom: '24px',
      }}>
        {/* Tile header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Seller Dashboard
          </p>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['today', 'week', 'month', 'lifetime'] as const).map(p => (
              <button
                key={p}
                onClick={() => setDashPeriod(p)}
                style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: dashPeriod === p ? 700 : 500,
                  border: `1px solid ${dashPeriod === p ? 'var(--color-blue)' : 'var(--color-border)'}`,
                  background: dashPeriod === p ? 'var(--color-blue-glow)' : 'transparent',
                  color: dashPeriod === p ? 'var(--color-blue)' : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all 0.12s ease',
                }}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'Past Week' : p === 'month' ? 'Past Month' : 'Lifetime'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Total Listed',   value: dashStats.totalListed,                              suffix: 'cards',   color: 'var(--color-text)' },
            { label: 'Cards Sold',     value: dashStats.totalSold,                                suffix: 'cards',   color: '#10b981' },
            { label: 'Total Value',    value: `₱${dashStats.totalValue.toLocaleString('en-PH')}`, suffix: null,      color: 'var(--color-text)' },
            { label: 'Amount Earned',  value: `₱${dashStats.amountEarned.toLocaleString('en-PH')}`, suffix: null,   color: '#10b981' },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{
              display: 'flex', flexDirection: 'column', gap: '4px',
              paddingRight: i < arr.length - 1 ? '16px' : 0,
              borderRight: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                {stat.label}
              </p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: stat.color, letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
                {stat.value}
              </p>
              {stat.suffix && (
                <p style={{ fontSize: '11px', color: 'var(--color-subtle)', margin: 0 }}>{stat.suffix}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Binder Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {/* Unsorted */}
        {[{ id: 'unsorted', name: 'Unsorted' }, ...binders].map((b) => {
          const isUnsorted = b.id === 'unsorted'
          const isActive = selectedBinderId === b.id
          const count = isUnsorted
            ? listings.filter(l => !l.binder_id).length
            : listings.filter(l => l.binder_id === b.id).length
          const unlistedCount = isUnsorted
            ? listings.filter(l => !l.binder_id && l.status === 'unlisted').length
            : listings.filter(l => l.binder_id === b.id && l.status === 'unlisted').length
          const isRenaming = !isUnsorted && renamingBinderId === b.id
          return (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameBinder(b.id, renameValue || b.name)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameBinder(b.id, renameValue || b.name)
                    if (e.key === 'Escape') setRenamingBinderId(null)
                  }}
                  style={{ width: '110px', fontSize: '13px', padding: '5px 9px', borderRadius: '8px' }}
                />
              ) : (
                <button
                  onClick={() => switchBinder(b.id as string | 'unsorted')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer', transition: 'all 0.12s ease',
                    ...(isUnsorted ? {
                      border: `1px solid ${isActive ? 'var(--color-blue)' : 'var(--color-border)'}`,
                      background: isActive ? 'var(--color-blue-glow)' : 'var(--color-surface)',
                      color: isActive ? 'var(--color-blue)' : 'var(--color-muted)',
                    } : binderTabStyle(b as Binder, isActive)),
                  }}
                >
                  {b.name}
                  {!isUnsorted && ((b as Binder).mana_colors ?? []).map((c, i) => (
                    <ManaIcon key={i} color={c} size={14} />
                  ))}
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px',
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'var(--color-surface-2)',
                    color: isActive ? 'var(--color-blue)' : 'var(--color-subtle)',
                    border: `1px solid ${isActive ? 'rgba(59,130,246,0.25)' : 'var(--color-border)'}`,
                  }}>{count}</span>
                  {unlistedCount > 0 && (
                    <span
                      title={`${unlistedCount} unlisted ${unlistedCount === 1 ? 'card' : 'cards'} in this binder`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: '#f59e0b', color: '#fff',
                        fontSize: '10px', fontWeight: 800, lineHeight: 1,
                        flexShrink: 0, cursor: 'default',
                      }}
                    >!</span>
                  )}
                </button>
              )}
              {!isUnsorted && !isRenaming && confirmDeleteBinderId !== b.id && (
                <>
                  <button
                    onClick={() => { setRenamingBinderId(b.id); setRenameValue(b.name) }}
                    title="Rename binder"
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-subtle)', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
                  >
                    <TrashPencilIcon type="pencil" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteBinderId(b.id)}
                    title="Delete binder"
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-subtle)', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
                  >
                    <TrashPencilIcon type="trash" />
                  </button>
                </>
              )}
              {!isUnsorted && !isRenaming && confirmDeleteBinderId === b.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', background: 'var(--color-surface)', border: '1px solid #f87171' }}>
                  <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600, whiteSpace: 'nowrap' }}>Delete + all cards?</span>
                  <button
                    onClick={() => handleDeleteBinder(b.id)}
                    disabled={deletingBinderId === b.id}
                    style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', opacity: deletingBinderId === b.id ? 0.6 : 1 }}
                  >
                    {deletingBinderId === b.id ? '…' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteBinderId(null)}
                    style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '5px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )
        })}
        <button
          onClick={handleAddBinder}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
            border: '1px dashed var(--color-border)',
            background: 'transparent', color: 'var(--color-subtle)',
            cursor: 'pointer', transition: 'all 0.12s ease',
          }}
        >
          + Add Binder
        </button>

        <button
          onClick={() => setBinderEditMode(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: binderEditMode ? 600 : 400,
            border: `1px solid ${binderEditMode ? 'var(--color-blue)' : 'var(--color-border)'}`,
            background: binderEditMode ? 'var(--color-blue-glow)' : 'transparent',
            color: binderEditMode ? 'var(--color-blue)' : 'var(--color-subtle)',
            cursor: 'pointer', transition: 'all 0.12s ease',
          }}
        >
          <PaletteIcon /> {binderEditMode ? 'Done' : 'Edit Binders'}
        </button>
      </div>

      {/* Binder customize panel */}
      {binderEditMode && selectedBinderId !== 'unsorted' && (() => {
        const b = binders.find(x => x.id === selectedBinderId)
        if (!b) return null
        return (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-blue)', borderRadius: '12px', padding: '20px 24px', marginBottom: '4px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-blue)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PaletteIcon /> Customizing: <span style={{ color: 'var(--color-text)' }}>{b.name}</span>
            </p>
            <BinderCustomizePanel
              binder={b}
              onColorChange={(field, value) => handleBinderColorChange(b.id, field, value)}
              onColorClear={field => clearBinderColor(b.id, field)}
              onManaToggle={color => toggleManaPip(b.id, color)}
              onReset={() => resetBinderStyle(b.id)}
            />
          </div>
        )
      })()}

      {/* Active binder info tile */}
      {selectedBinderId !== 'unsorted' && (() => {
        const activeBinder = binders.find(b => b.id === selectedBinderId)
        if (!activeBinder) return null
        const binderAll = listings.filter(l => l.binder_id === selectedBinderId)
        const totalCards = binderAll.length
        const totalSold = binderAll.filter(l => l.status === 'sold').length
        const binderTotalValue = binderAll
          .reduce((sum, l) => sum + l.price * l.quantity, 0)
        const valueEarned = binderAll
          .filter(l => l.status === 'sold')
          .reduce((sum, l) => sum + l.price * l.quantity, 0)
        const isEditingDesc = editingDescId === selectedBinderId
        return (
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
          }}>
            {/* Description row */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Description
                </p>
                {!isEditingDesc && (
                  <button
                    onClick={() => { setEditingDescId(selectedBinderId); setDescValue(activeBinder.description ?? '') }}
                    title="Edit description"
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-subtle)', cursor: 'pointer', padding: '1px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                  >
                    <TrashPencilIcon type="pencil" size={11} />
                  </button>
                )}
              </div>
              {isEditingDesc ? (
                <input
                  autoFocus
                  value={descValue}
                  onChange={e => setDescValue(e.target.value)}
                  onBlur={() => handleDescribeBinder(selectedBinderId, descValue)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleDescribeBinder(selectedBinderId, descValue)
                    if (e.key === 'Escape') setEditingDescId(null)
                  }}
                  placeholder="Add a short description…"
                  style={{ width: '100%', maxWidth: '480px', fontSize: '13px', padding: '6px 10px', borderRadius: '7px' }}
                />
              ) : (
                <button
                  onClick={() => { setEditingDescId(selectedBinderId); setDescValue(activeBinder.description ?? '') }}
                  style={{
                    background: 'transparent', border: 'none', padding: 0,
                    fontSize: '13px', color: activeBinder.description ? 'var(--color-text)' : 'var(--color-subtle)',
                    cursor: 'pointer', textAlign: 'left', fontStyle: activeBinder.description ? 'normal' : 'italic',
                  }}
                >
                  {activeBinder.description ?? 'Add description…'}
                </button>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
              {/* Group 1: Total Cards | Total Sold */}
              <div style={{ display: 'flex', gap: '24px', paddingRight: '24px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Total Cards</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{totalCards}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Total Sold</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{totalSold}</p>
                </div>
              </div>

              <div style={{ width: '1px', background: 'var(--color-border)', alignSelf: 'stretch', marginRight: '24px' }} />

              {/* Group 2: Binder Total Value | Value Earned */}
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Binder Total Value</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>₱{binderTotalValue.toLocaleString('en-PH')}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Value Earned</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', letterSpacing: '-0.02em' }}>₱{valueEarned.toLocaleString('en-PH')}</p>
                </div>
              </div>
            </div>

          </div>
        )
      })()}

      {/* Status Tabs */}
      <div style={{
        display: 'flex', gap: '2px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '20px',
      }}>
        {(selectedBinderId === 'unsorted' ? ['unlisted'] as ListingStatus[] : ['listed', 'unlisted', 'sold'] as ListingStatus[]).map(tab => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--color-blue)' : 'transparent'}`,
                color: isActive ? 'var(--color-blue)' : 'var(--color-muted)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: '-1px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {STATUS_LABELS[tab]}
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: '10px',
                background: isActive ? 'var(--color-blue-glow)' : 'var(--color-surface-2)',
                color: isActive ? 'var(--color-blue)' : 'var(--color-subtle)',
                border: `1px solid ${isActive ? 'rgba(59,130,246,0.25)' : 'var(--color-border)'}`,
              }}>
                {tabCounts[tab]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, minWidth: '220px', display: 'flex',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '9px', overflow: 'hidden',
        }}>
          <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', color: 'var(--color-subtle)' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search your listings…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, border: 'none', borderRadius: 0, padding: '10px 0', background: 'transparent', fontSize: '14px' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ padding: '0 12px', background: 'transparent', color: 'var(--color-subtle)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <XSmallIcon />
            </button>
          )}
        </div>

        <select value={sort} onChange={e => setSort(e.target.value as SortOption)}
          style={{ padding: '10px 12px', borderRadius: '9px', minWidth: '160px', fontSize: '13px', cursor: 'pointer' }}>
          <option value="price_desc">Price: High → Low</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="most_viewed">Most viewed</option>
          <option value="alpha">A → Z</option>
        </select>

        <button onClick={() => setFiltersOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '10px 14px', borderRadius: '9px',
          background: filtersOpen ? 'var(--color-blue-glow)' : 'var(--color-surface)',
          border: `1px solid ${filtersOpen ? 'rgba(59,130,246,0.35)' : 'var(--color-border)'}`,
          color: filtersOpen ? 'var(--color-blue)' : 'var(--color-muted)',
          fontSize: '13px', fontWeight: 500, transition: 'all 0.15s ease',
        }}>
          <FilterIcon />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: 'var(--color-blue)', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', fontWeight: 700 }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '12px', padding: '20px 24px', marginBottom: '20px',
          display: 'flex', gap: '32px', flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Condition</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CONDITIONS.map(c => (
                <button key={c} onClick={() => toggleCondition(c)} style={{
                  padding: '5px 11px', borderRadius: '7px',
                  border: `1px solid ${conditions.has(c) ? 'var(--color-blue)' : 'var(--color-border)'}`,
                  background: conditions.has(c) ? 'var(--color-blue-glow)' : 'transparent',
                  color: conditions.has(c) ? 'var(--color-blue)' : 'var(--color-muted)',
                  fontSize: '12px', fontWeight: conditions.has(c) ? 600 : 400, transition: 'all 0.15s ease',
                }}>
                  {c} <span style={{ opacity: 0.6 }}>· {CONDITION_LABELS[c]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Range (₱)</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="number" placeholder="Min ₱" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                style={{ width: '90px', padding: '7px 10px', fontSize: '13px' }} min="0" step="1" />
              <span style={{ color: 'var(--color-subtle)', fontSize: '12px' }}>to</span>
              <input type="number" placeholder="Max ₱" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                style={{ width: '90px', padding: '7px 10px', fontSize: '13px' }} min="0" step="1" />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => { setConditions(new Set()); setMinPrice(''); setMaxPrice('') }}
                style={{ background: 'transparent', color: 'var(--color-muted)', fontSize: '12px', padding: '7px 12px', border: '1px solid var(--color-border)', borderRadius: '7px' }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <SkeletonGrid />
      ) : displayedListings.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          {query || activeFilterCount > 0 ? (
            <>
              <p style={{ fontSize: '15px', color: 'var(--color-muted)', marginBottom: '8px' }}>No listings match your search.</p>
              <p style={{ fontSize: '13px', color: 'var(--color-subtle)' }}>Try a different search or clear your filters.</p>
            </>
          ) : activeTab === 'listed' ? (
            <>
              <p style={{ fontSize: '15px', color: 'var(--color-muted)', marginBottom: '12px' }}>You haven't listed any cards yet.</p>
              <Link href="/sell" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'var(--color-blue)', color: '#fff', borderRadius: '9px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                <PlusIcon /> List your first card
              </Link>
            </>
          ) : activeTab === 'unlisted' && selectedBinderId !== 'unsorted' ? (
            <p style={{ fontSize: '15px', color: 'var(--color-muted)' }}>No unlisted cards. Move listed cards here to hide them from buyers.</p>
          ) : activeTab === 'unlisted' && selectedBinderId === 'unsorted' ? (
            <>
              <div style={{ marginBottom: '8px', color: 'var(--color-blue)', display: 'flex', justifyContent: 'center' }}><SparkleIcon /></div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>All sorted!</p>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Every card is in a binder. Nice work keeping things tidy!</p>
            </>
          ) : (
            <p style={{ fontSize: '15px', color: 'var(--color-muted)' }}>No sold cards yet. Mark listings as sold when you complete a sale.</p>
          )}
        </div>
      ) : (
        <>
          {/* List header: count + select all */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            {/* Select-all checkbox */}
            <button
              onClick={toggleSelectAll}
              title={allSelected ? 'Deselect all' : 'Select all'}
              style={{
                width: '20px', height: '20px', flexShrink: 0,
                border: `2px solid ${allSelected || someSelected ? 'var(--color-blue)' : 'var(--color-border)'}`,
                borderRadius: '5px',
                background: allSelected ? 'var(--color-blue)' : 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.12s ease',
              }}
            >
              {allSelected && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
              )}
              {someSelected && !allSelected && (
                <div style={{ width: '10px', height: '2px', background: 'var(--color-blue)', borderRadius: '1px' }} />
              )}
            </button>
            <p style={{ fontSize: '12px', color: 'var(--color-subtle)' }}>
              {selectedIds.size > 0
                ? <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>{selectedIds.size} selected</span>
                : <>{displayedListings.length} listing{displayedListings.length !== 1 ? 's' : ''}</>
              }
            </p>
          </div>

          <div className="ml-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedListings.map(listing => (
              <ListingRow
                key={listing.id}
                listing={listing}
                activeTab={activeTab}
                checked={selectedIds.has(listing.id)}
                onCheck={() => toggleSelect(listing.id)}
                isEditing={editingId === listing.id}
                confirmingDelete={confirmDeleteId === listing.id}
                deleting={deletingId === listing.id}
                onEdit={() => { setEditingId(listing.id); setConfirmDeleteId(null) }}
                onCancelEdit={() => setEditingId(null)}
                onSave={handleSave}
                onRequestDelete={() => { setConfirmDeleteId(listing.id); setEditingId(null) }}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onConfirmDelete={() => handleDelete(listing.id)}
                onStatusChange={(status) => handleStatusChange([listing.id], status)}
                binders={binders}
                onMoveToBinder={(binderId) => handleMoveToBinder([listing.id], binderId)}
              />
            ))}
          </div>
        </>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-2)',
          borderRadius: '14px',
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          zIndex: 100,
          maxWidth: 'calc(100vw - 32px)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', paddingRight: '4px' }}>
            {selectedIds.size} selected
          </span>
          <div style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 4px' }} />
          {BULK_ACTIONS[activeTab].map(targetStatus => (
            <button
              key={targetStatus}
              onClick={() => handleStatusChange(Array.from(selectedIds), targetStatus)}
              disabled={bulkLoading}
              style={{
                padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                border: '1px solid var(--color-border)',
                background: targetStatus === 'sold' ? 'rgba(16,185,129,0.1)' : targetStatus === 'unlisted' ? 'var(--color-surface-2)' : 'var(--color-blue-glow)',
                color: targetStatus === 'sold' ? '#10b981' : targetStatus === 'unlisted' ? 'var(--color-muted)' : 'var(--color-blue)',
                cursor: bulkLoading ? 'not-allowed' : 'pointer',
                opacity: bulkLoading ? 0.6 : 1,
                transition: 'all 0.12s ease',
              }}
            >
              {targetStatus === 'listed' ? 'Relist' : targetStatus === 'unlisted' ? 'Unlist' : 'Mark as Sold'}
            </button>
          ))}
          <div style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 4px' }} />
          <select
            onChange={e => { if (e.target.value) handleMoveToBinder(Array.from(selectedIds), e.target.value === 'unsorted' ? null : e.target.value) }}
            defaultValue=""
            disabled={bulkLoading}
            style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', cursor: 'pointer' }}
          >
            <option value="" disabled>Move to binder…</option>
            <option value="unsorted">Unsorted</option>
            {binders.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 4px' }} />
          {confirmBulkDelete ? (
            <>
              <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>
                Delete {selectedIds.size} listing{selectedIds.size !== 1 ? 's' : ''}?
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                style={{
                  padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                  color: '#f87171', cursor: bulkLoading ? 'not-allowed' : 'pointer',
                  opacity: bulkLoading ? 0.6 : 1,
                }}
              >
                {bulkLoading ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmBulkDelete(false)}
                style={{
                  padding: '7px 12px', borderRadius: '8px', fontSize: '12px',
                  background: 'transparent', border: '1px solid var(--color-border)',
                  color: 'var(--color-subtle)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmBulkDelete(true)}
                disabled={bulkLoading}
                style={{
                  padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171', cursor: 'pointer',
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{
                  padding: '7px 12px', borderRadius: '8px', fontSize: '12px',
                  background: 'transparent', border: '1px solid var(--color-border)',
                  color: 'var(--color-subtle)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Listing Row ─────────────────────────────────────────────────────── */

function ListingRow({
  listing, activeTab, checked, onCheck,
  isEditing, confirmingDelete, deleting,
  onEdit, onCancelEdit, onSave,
  onRequestDelete, onCancelDelete, onConfirmDelete,
  onStatusChange, binders, onMoveToBinder,
}: {
  listing: Listing
  activeTab: ListingStatus
  checked: boolean
  onCheck: () => void
  isEditing: boolean
  confirmingDelete: boolean
  deleting: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (updated: Listing) => void
  onRequestDelete: () => void
  binders: Binder[]
  onMoveToBinder: (binderId: string | null) => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  onStatusChange: (status: ListingStatus) => void
}) {
  const condition = listing.condition as CardCondition
  const conditionColor = CONDITION_COLORS[condition] ?? 'var(--color-muted)'
  const { onMouseMove, onMouseLeave: onPreviewLeave, preview } = useCardHover(listing.card_image_uri)

  return (
    <div
      className={`ml-row${isEditing ? ' ml-editing' : ''}`}
      style={{
        background: checked ? 'rgba(59,130,246,0.04)' : 'var(--color-surface)',
        border: `1px solid ${checked ? 'rgba(59,130,246,0.4)' : confirmingDelete ? 'rgba(239,68,68,0.35)' : isEditing ? 'rgba(59,130,246,0.35)' : 'var(--color-border)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Row summary */}
      <div className="ml-row-inner" style={{ display: 'grid', gridTemplateColumns: '32px 56px 1fr auto', gap: '12px', alignItems: 'center', padding: '14px 16px 14px 14px' }}>

        {/* Checkbox */}
        <button
          className="ml-checkbox-col"
          onClick={onCheck}
          style={{
            width: '20px', height: '20px', flexShrink: 0,
            border: `2px solid ${checked ? 'var(--color-blue)' : 'var(--color-border)'}`,
            borderRadius: '5px',
            background: checked ? 'var(--color-blue)' : 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.12s ease',
          }}
        >
          {checked && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
          )}
        </button>

        {/* Thumbnail */}
        <div
          className="ml-thumb-col"
          onMouseMove={onMouseMove}
          onMouseLeave={onPreviewLeave}
          style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', background: 'var(--color-surface-2)', flexShrink: 0, border: '1px solid var(--color-border)' }}
        >
          {preview}
          {listing.card_image_uri ? (
            <img src={listing.card_image_uri} alt={listing.card_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardPlaceholderIcon />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="ml-info-col" style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <Link href={`/card/${listing.card_id}`}
              style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>
              {listing.card_name}
            </Link>
            <span style={{ fontSize: '11px', fontWeight: 600, color: conditionColor, background: `${conditionColor}18`, border: `1px solid ${conditionColor}40`, borderRadius: '5px', padding: '1px 6px', flexShrink: 0 }}>
              {condition}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {listing.card_set_name && <span className="ml-secondary" style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{listing.card_set_name}</span>}
            <span style={{ fontSize: '12px', color: 'var(--color-subtle)' }}>{listing.quantity} avail.</span>
            <span className="ml-secondary" style={{ fontSize: '12px', color: 'var(--color-subtle)' }}>{listing.views} view{listing.views !== 1 ? 's' : ''}</span>
            <span className="ml-secondary" style={{ fontSize: '12px', color: 'var(--color-subtle)' }}>Listed {formatDate(listing.created_at)}</span>
          </div>
        </div>

        {/* Right: price + actions */}
        <div className="ml-actions-col" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span className="ml-price" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            ₱{listing.price.toLocaleString('en-PH')}
          </span>

          {confirmingDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#ef4444' }}>Delete?</span>
              <button onClick={onConfirmDelete} disabled={deleting} style={{
                padding: '5px 10px', borderRadius: '6px', background: '#ef4444', color: '#fff',
                border: 'none', fontSize: '12px', fontWeight: 600,
                cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1,
              }}>
                {deleting ? '…' : 'Yes, delete'}
              </button>
              <button onClick={onCancelDelete} style={{ padding: '5px 10px', borderRadius: '6px', background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)', fontSize: '12px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* Quick status actions */}
              <div className="ml-status-btns" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {activeTab === 'listed' && (
                  <>
                    <QuickStatusButton label="Unlist" onClick={() => onStatusChange('unlisted')} />
                    <QuickStatusButton label="Sold" onClick={() => onStatusChange('sold')} color="#10b981" />
                  </>
                )}
                {activeTab === 'unlisted' && (
                  <>
                    <QuickStatusButton label="Relist" onClick={() => onStatusChange('listed')} color="var(--color-blue)" />
                    <QuickStatusButton label="Sold" onClick={() => onStatusChange('sold')} color="#10b981" />
                  </>
                )}
                {activeTab === 'sold' && (
                  <QuickStatusButton label="Relist" onClick={() => onStatusChange('listed')} color="var(--color-blue)" />
                )}
              </div>

              <div className="ml-divider" style={{ width: '1px', height: '18px', background: 'var(--color-border)' }} />

              {/* Icon buttons */}
              <div className="ml-icon-btns" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link className="ml-view-btn" href={`/card/${listing.card_id}`} title="View listing" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '7px',
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  color: 'var(--color-muted)', textDecoration: 'none',
                }}>
                  <EyeIcon />
                </Link>
                <button onClick={onEdit} title="Edit listing" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '7px',
                  background: isEditing ? 'var(--color-blue-glow)' : 'var(--color-surface-2)',
                  border: `1px solid ${isEditing ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
                  color: isEditing ? 'var(--color-blue)' : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
                  <PencilIcon />
                </button>
                <button onClick={onRequestDelete} title="Delete listing" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '7px',
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  color: 'var(--color-muted)', cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)' }}
                >
                  <TrashIcon />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inline edit panel */}
      {isEditing && (
        <EditPanel
          listing={listing}
          onSave={onSave}
          onCancel={onCancelEdit}
          binders={binders}
          onMoveToBinder={onMoveToBinder}
        />
      )}
    </div>
  )
}

function QuickStatusButton({ label, onClick, color = 'var(--color-muted)' }: { label: string; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
        background: 'transparent',
        border: `1px solid var(--color-border)`,
        color,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = color
        ;(e.currentTarget as HTMLButtonElement).style.background = `${color}14`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {label}
    </button>
  )
}

/* ─── Edit Panel ──────────────────────────────────────────────────────── */

type PrintingOption = {
  id: string
  set: string
  set_name: string
  image_uri: string | null
  rarity: string
  released_at: string
  collector_number: string
}

function EditPanel({ listing, onSave, onCancel, binders, onMoveToBinder }: {
  listing: Listing
  onSave: (updated: Listing) => void
  onCancel: () => void
  binders: Binder[]
  onMoveToBinder: (binderId: string | null) => void
}) {
  const supabase = createClient()

  const [printings, setPrintings] = useState<PrintingOption[]>([])
  const [printingsLoading, setPrintingsLoading] = useState(true)
  const [selectedPrinting, setSelectedPrinting] = useState<PrintingOption | null>(null)

  const [condition, setCondition] = useState<CardCondition>(listing.condition)
  const [isFoil, setIsFoil] = useState(listing.is_foil ?? false)
  const [price, setPrice] = useState(listing.price.toString())
  const [quantity, setQuantity] = useState(listing.quantity.toString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPrintings() {
      setPrintingsLoading(true)
      try {
        const res = await fetch(
          `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(listing.card_name)}"&unique=prints&order=released`,
        )
        const data = await res.json()
        if (data.data) {
          const opts: PrintingOption[] = data.data.map((c: ScryfallCard) => ({
            id: c.id,
            set: c.set,
            set_name: c.set_name,
            image_uri: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? null,
            rarity: c.rarity,
            released_at: c.released_at,
            collector_number: c.collector_number,
          }))
          setPrintings(opts)
          const current = opts.find(o => o.id === listing.card_id) ?? null
          setSelectedPrinting(current)
        }
      } catch {
        // silently fail
      }
      setPrintingsLoading(false)
    }
    fetchPrintings()
  }, [listing.card_id, listing.card_name])

  const usdCache = useRef<Record<string, { usd: string | null; usdFoil: string | null }>>({})
  const [currentUsd, setCurrentUsd] = useState<string | null>(null)
  const [currentUsdFoil, setCurrentUsdFoil] = useState<string | null>(null)

  const selectPrinting = async (p: PrintingOption) => {
    setSelectedPrinting(p)
    if (usdCache.current[p.id] !== undefined) {
      setCurrentUsd(usdCache.current[p.id].usd)
      setCurrentUsdFoil(usdCache.current[p.id].usdFoil)
      return
    }
    try {
      const res = await fetch(`https://api.scryfall.com/cards/${p.id}`)
      const data = await res.json()
      const usd = data.prices?.usd ?? null
      const usdFoil = data.prices?.usd_foil ?? null
      usdCache.current[p.id] = { usd, usdFoil }
      setCurrentUsd(usd)
      setCurrentUsdFoil(usdFoil)
    } catch {
      usdCache.current[p.id] = { usd: null, usdFoil: null }
      setCurrentUsd(null)
      setCurrentUsdFoil(null)
    }
  }

  useEffect(() => {
    if (listing.card_id) {
      fetch(`https://api.scryfall.com/cards/${listing.card_id}`)
        .then(r => r.json())
        .then(d => {
          const usd = d.prices?.usd ?? null
          const usdFoil = d.prices?.usd_foil ?? null
          usdCache.current[listing.card_id] = { usd, usdFoil }
          setCurrentUsd(usd)
          setCurrentUsdFoil(usdFoil)
        })
        .catch(() => {})
    }
  }, [listing.card_id])

  const applyMultiplier = (rate: number) => {
    const base = isFoil ? (currentUsdFoil ?? currentUsd) : currentUsd
    if (!base) return
    setPrice(Math.round(parseFloat(base) * rate).toString())
  }

  const handleSave = async () => {
    const parsedPrice = parseInt(price, 10)
    const parsedQty = parseInt(quantity, 10)
    if (!parsedPrice || parsedPrice < 1) { setError('Enter a valid price.'); return }
    if (isNaN(parsedQty) || parsedQty < 0) { setError('Enter a valid quantity (0 or more).'); return }

    setSaving(true)
    setError('')

    const patch: Record<string, unknown> = {
      price: parsedPrice,
      quantity: parsedQty,
      condition,
      is_foil: isFoil,
      usd_price: isFoil
        ? parseFloat(currentUsdFoil ?? currentUsd ?? '0') || null
        : parseFloat(currentUsd ?? '0') || null,
    }

    if (selectedPrinting && selectedPrinting.id !== listing.card_id) {
      patch.card_id = selectedPrinting.id
      patch.card_set = selectedPrinting.set
      patch.card_set_name = selectedPrinting.set_name
      patch.card_image_uri = selectedPrinting.image_uri
      patch.card_rarity = selectedPrinting.rarity
    }

    const { data, error: dbErr } = await supabase
      .from('listings')
      .update(patch)
      .eq('id', listing.id)
      .select()
      .single()

    if (dbErr) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    onSave(data as Listing)
  }

  return (
    <div style={{
      borderTop: '1px solid var(--color-border)',
      padding: '24px',
      background: 'var(--color-surface-2)',
    }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>
        Edit Listing
      </p>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Printing picker */}
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Card Printing
          </p>

          {printingsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '6px' }} />
              ))}
            </div>
          ) : printings.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No printings found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {printings.map(p => {
                const isSelected = selectedPrinting?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPrinting(p)}
                    title={`${p.set_name} (${p.set.toUpperCase()}) · ${p.rarity}`}
                    style={{
                      padding: 0,
                      border: `2px solid ${isSelected ? 'var(--color-blue)' : 'transparent'}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: isSelected ? 'var(--color-blue-glow)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: isSelected ? '0 0 0 1px rgba(59,130,246,0.3)' : 'none',
                      transition: 'border-color 0.12s ease',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {p.image_uri ? (
                      <HoverCardImage src={p.image_uri} alt={p.set_name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CardPlaceholderIcon />
                      </div>
                    )}
                    <div style={{ padding: '3px 4px', textAlign: 'center' }}>
                      <p style={{ fontSize: '9px', fontWeight: 600, color: isSelected ? 'var(--color-blue)' : 'var(--color-muted)', textTransform: 'uppercase', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.set.toUpperCase()}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {selectedPrinting && (
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '10px' }}>
              Selected: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{selectedPrinting.set_name}</span>
              <span style={{ color: 'var(--color-subtle)' }}> · {selectedPrinting.set.toUpperCase()} · #{selectedPrinting.collector_number}</span>
            </p>
          )}
        </div>

        {/* Condition + Price + Quantity */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '220px' }}>

          {/* Condition */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Condition
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {CONDITIONS.map(c => {
                const isSelected = condition === c
                const color = CONDITION_COLORS[c]
                return (
                  <button
                    key={c}
                    onClick={() => setCondition(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 12px', borderRadius: '8px',
                      border: `1px solid ${isSelected ? color : 'var(--color-border)'}`,
                      background: isSelected ? `${color}12` : 'transparent',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s ease',
                    }}
                  >
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: isSelected ? color : 'var(--color-subtle)',
                      background: isSelected ? `${color}20` : 'var(--color-surface)',
                      border: `1px solid ${isSelected ? `${color}60` : 'var(--color-border)'}`,
                      borderRadius: '4px', padding: '1px 6px',
                      minWidth: '36px', textAlign: 'center',
                    }}>
                      {c}
                    </span>
                    <span style={{ fontSize: '13px', color: isSelected ? 'var(--color-text)' : 'var(--color-muted)', fontWeight: isSelected ? 500 : 400 }}>
                      {CONDITION_LABELS[c]}
                    </span>
                    {isSelected && (
                      <span style={{ marginLeft: 'auto', color }}>
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Foil */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Foil
            </label>
            <button onClick={() => setIsFoil(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: '8px',
              border: `1px solid ${isFoil ? 'rgba(234,179,8,0.5)' : 'var(--color-border)'}`,
              background: isFoil ? 'rgba(234,179,8,0.08)' : 'transparent',
              color: isFoil ? '#fbbf24' : 'var(--color-muted)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={isFoil ? '#fbbf24' : 'none'} stroke={isFoil ? '#fbbf24' : 'currentColor'} strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              {isFoil ? <><CheckIcon /> Foil</> : 'Non-foil'}
            </button>
          </div>

          {/* Price */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Price
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', fontSize: '14px', color: 'var(--color-muted)', borderRight: '1px solid var(--color-border)' }}>₱</span>
              <input
                type="number" value={price} onChange={e => setPrice(e.target.value)}
                min="1" step="1"
                style={{ flex: 1, border: 'none', borderRadius: 0, padding: '10px 10px', fontSize: '15px', fontWeight: 700, background: 'transparent', width: '120px' }}
              />
            </div>

            {(() => {
              const base = isFoil ? (currentUsdFoil ?? currentUsd) : currentUsd
              return base ? (
                <div style={{ marginTop: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--color-subtle)', marginBottom: '6px' }}>
                    TCGPlayer{isFoil ? ' foil' : ''}: <span style={{ color: 'var(--color-muted)' }}>${base} USD</span> — suggest PHP:
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[30, 40, 50, 60, 70].map(rate => (
                      <button key={rate} onClick={() => applyMultiplier(rate)} style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        color: 'var(--color-muted)', cursor: 'pointer', transition: 'all 0.12s ease',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-blue)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-blue)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)' }}
                      >
                        ×{rate} <span style={{ opacity: 0.7 }}>₱{Math.round(parseFloat(base) * rate).toLocaleString('en-PH')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            })()}
          </div>

          {/* Quantity */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Quantity
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setQuantity(q => String(Math.max(0, parseInt(q || '0') - 1)))}
                style={{ width: '32px', height: '38px', borderRadius: '7px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: '16px', cursor: 'pointer' }}
              >−</button>
              <input
                type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                min="0" step="1"
                style={{ width: '64px', padding: '9px 10px', fontSize: '15px', fontWeight: 700, textAlign: 'center', borderRadius: '7px' }}
              />
              <button
                onClick={() => setQuantity(q => String(parseInt(q || '1') + 1))}
                style={{ width: '32px', height: '38px', borderRadius: '7px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: '16px', cursor: 'pointer' }}
              >+</button>
            </div>
          </div>

          {/* Binder assignment */}
          {binders.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Binder</p>
              <select
                value={listing.binder_id ?? 'unsorted'}
                onChange={e => onMoveToBinder(e.target.value === 'unsorted' ? null : e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px' }}
              >
                <option value="unsorted">Unsorted</option>
                {binders.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p style={{ fontSize: '13px', color: '#ef4444' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: '10px 16px', background: 'var(--color-blue)', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={onCancel} style={{
              padding: '10px 14px', background: 'transparent',
              border: '1px solid var(--color-border)', borderRadius: '8px',
              color: 'var(--color-muted)', fontSize: '13px', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton ────────────────────────────────────────────────────────── */

function SkeletonGrid() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 56px 1fr auto', gap: '12px', alignItems: 'center', padding: '14px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
          <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '5px' }} />
          <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '8px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ height: '15px', width: '200px' }} />
            <div className="skeleton" style={{ height: '12px', width: '140px' }} />
          </div>
          <div className="skeleton" style={{ height: '20px', width: '70px' }} />
        </div>
      ))}
    </div>
  )
}

/* ─── Icons ───────────────────────────────────────────────────────────── */

function TrashPencilIcon({ type, size = 13 }: { type: 'trash' | 'pencil'; size?: number }) {
  if (type === 'trash') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function FilterIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function EyeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
}
function PencilIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
}
function CardPlaceholderIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-subtle)' }}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18" /></svg>
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
}
function PaletteIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>
}
function SparkleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" /><path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75Z" /><path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5Z" /></svg>
}
function XSmallIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}

export default function MyListingsPage() {
  return <Suspense><MyListingsContent /></Suspense>
}

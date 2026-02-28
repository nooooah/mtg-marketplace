'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

/* ── Scryfall types ─────────────────────────────────────────── */
interface ScryfallCard {
  id: string
  name: string
  set_name: string
  set: string
  image_uris?: { small: string }
  card_faces?: { image_uris?: { small: string } }[]
}

/* ── Debounce helper ────────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/* ═══════════════════════════════════════════════════════════════
   Navbar
═══════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)      // account dropdown
  const [mobileOpen, setMobileOpen] = useState(false)  // mobile hamburger

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    setMobileOpen(false)
    router.push('/')
    router.refresh()
  }

  const isActive = (path: string) => pathname === path

  return (
    <>
      <style>{`
        .nb-desktop { display: flex; }
        .nb-hamburger { display: none; }
        .nb-search { max-width: 280px; }
        @media (max-width: 680px) {
          .nb-desktop  { display: none !important; }
          .nb-hamburger { display: flex !important; }
          .nb-search { max-width: 100%; flex: 1; }
        }
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'rgba(15,15,15,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* ── Main bar ── */}
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          padding: '0 1.25rem', height: '56px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>

          {/* Logo */}
          <Link href="/" style={{
            fontWeight: 700, fontSize: '15px', color: 'var(--color-text)',
            textDecoration: 'none', letterSpacing: '-0.02em',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            TCG<span style={{ color: 'var(--color-blue)' }}> Community</span> Market
          </Link>

          {/* Search — grows to fill space */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <NavSearchBar />
          </div>

          {/* Desktop nav links + auth */}
          <div className="nb-desktop" style={{ alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <NavLink href="/events" active={isActive('/events')}>Events</NavLink>
            <NavLink href="/buy"    active={isActive('/buy')}>Buy</NavLink>
            <NavLink href="/sell"   active={isActive('/sell')}>Sell</NavLink>

            <div style={{ width: '1px', height: '16px', background: 'var(--color-border)', margin: '0 8px' }} />

            {user ? (
              <AccountMenu user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} handleSignOut={handleSignOut} />
            ) : (
              <GuestButtons />
            )}
          </div>

          {/* Hamburger (mobile only) */}
          <button
            className="nb-hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
            style={{
              flexShrink: 0, width: '36px', height: '36px',
              display: 'none', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--color-border)',
              borderRadius: '8px', color: 'var(--color-text)', padding: 0,
            }}
          >
            {mobileOpen ? <XIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {/* ── Mobile slide-down menu ── */}
        {mobileOpen && (
          <div style={{
            borderTop: '1px solid var(--color-border)',
            background: 'rgba(15,15,15,0.97)',
            padding: '12px 1.25rem 20px',
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            <MobileNavLink href="/events" active={isActive('/events')} onClick={() => setMobileOpen(false)}>Events</MobileNavLink>
            <MobileNavLink href="/buy"    active={isActive('/buy')}    onClick={() => setMobileOpen(false)}>Buy</MobileNavLink>
            <MobileNavLink href="/sell"   active={isActive('/sell')}   onClick={() => setMobileOpen(false)}>Sell</MobileNavLink>

            <div style={{ borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />

            {user ? (
              <>
                <MobileNavLink href="/profile"     active={isActive('/profile')}     onClick={() => setMobileOpen(false)}>My Profile</MobileNavLink>
                <MobileNavLink href="/messages"    active={isActive('/messages')}    onClick={() => setMobileOpen(false)}>Messages</MobileNavLink>
                <MobileNavLink href="/my-listings" active={isActive('/my-listings')} onClick={() => setMobileOpen(false)}>My Listings</MobileNavLink>
                <button
                  onClick={handleSignOut}
                  style={{
                    marginTop: '4px', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444', fontSize: '14px', fontWeight: 500, textAlign: 'left',
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid var(--color-border)', background: 'transparent',
                    color: 'var(--color-text)', fontSize: '14px', textAlign: 'center',
                    textDecoration: 'none', display: 'block',
                  }}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--color-blue)', color: '#fff',
                    fontSize: '14px', fontWeight: 600, textAlign: 'center',
                    textDecoration: 'none', display: 'block',
                  }}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Search bar with Scryfall suggestions
═══════════════════════════════════════════════════════════════ */
function NavSearchBar() {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<ScryfallCard[]>([])
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const debouncedQuery = useDebounce(value, 260)
  const showDropdown = focused && (suggestions.length > 0 || loading) && value.trim().length > 1

  // Fetch suggestions
  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 2) { setSuggestions([]); setLoading(false); return }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)

    fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=name&unique=cards&page=1`, {
      signal: ctrl.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (data.data) setSuggestions((data.data as ScryfallCard[]).slice(0, 6))
        else setSuggestions([])
        setLoading(false)
      })
      .catch(() => { setLoading(false) })
  }, [debouncedQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false); setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const commit = useCallback((card: ScryfallCard) => {
    setValue(card.name)
    setSuggestions([])
    setFocused(false)
    setActiveIdx(-1)
    router.push(`/buy?q=${encodeURIComponent(card.name)}`)
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      commit(suggestions[activeIdx]); return
    }
    if (value.trim()) {
      setSuggestions([]); setFocused(false)
      router.push(`/buy?q=${encodeURIComponent(value.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    if (e.key === 'Escape')    { setFocused(false); setActiveIdx(-1) }
  }

  function cardImage(card: ScryfallCard) {
    return card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small ?? null
  }

  return (
    <div ref={containerRef} className="nb-search" style={{ position: 'relative', width: '100%' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--color-surface)', border: `1px solid ${focused ? 'var(--color-border-2)' : 'var(--color-border)'}`,
          borderRadius: showDropdown ? '8px 8px 0 0' : '8px',
          overflow: 'hidden', width: '100%',
          transition: 'border-color 0.15s ease',
        }}
      >
        <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}>
          {loading ? <SpinnerIcon /> : <SearchIcon />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { setValue(e.target.value); setActiveIdx(-1) }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search cards…"
          autoComplete="off"
          style={{
            flex: 1, background: 'transparent', border: 'none', borderRadius: 0,
            padding: '8px 0', fontSize: '13px', color: 'var(--color-text)',
            outline: 'none', width: '100%',
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => { setValue(''); setSuggestions([]); inputRef.current?.focus() }}
            style={{
              padding: '0 10px', background: 'transparent', border: 'none',
              color: 'var(--color-subtle)', display: 'flex', alignItems: 'center',
            }}
          >
            <XSmallIcon />
          </button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-2)', borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {suggestions.map((card, i) => {
            const img = cardImage(card)
            const isActive = i === activeIdx
            return (
              <button
                key={card.id}
                type="button"
                onMouseDown={() => commit(card)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '8px 12px', textAlign: 'left',
                  background: isActive ? 'var(--color-surface-2)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.1s ease',
                }}
              >
                {img ? (
                  <img src={img} alt="" style={{ width: '28px', height: '39px', borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '28px', height: '39px', borderRadius: '3px', background: 'var(--color-surface-2)', flexShrink: 0 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.set_name} · {card.set.toUpperCase()}
                  </span>
                </div>
              </button>
            )
          })}

          {/* Footer: search all results */}
          <button
            type="button"
            onMouseDown={handleSubmit as unknown as React.MouseEventHandler}
            onMouseEnter={() => setActiveIdx(suggestions.length)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '9px 12px', textAlign: 'left',
              background: activeIdx === suggestions.length ? 'var(--color-surface-2)' : 'rgba(59,130,246,0.06)',
              border: 'none', borderTop: '1px solid var(--color-border)',
              color: 'var(--color-blue)', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <SearchIcon />
            Search marketplace for &ldquo;{value}&rdquo; →
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Account dropdown ─────────────────────────────────────── */
function AccountMenu({ user, menuOpen, setMenuOpen, handleSignOut }: {
  user: User; menuOpen: boolean
  setMenuOpen: (v: boolean) => void; handleSignOut: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setMenuOpen])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 10px', borderRadius: '8px',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          color: 'var(--color-text)', fontSize: '13px',
        }}
      >
        <span style={{
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'var(--color-blue)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {user.email?.[0]?.toUpperCase()}
        </span>
        <ChevronDown size={12} />
      </button>

      {menuOpen && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: '160px',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '10px', padding: '4px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <DropdownItem href="/profile" onClick={() => setMenuOpen(false)}>My Profile</DropdownItem>
          <DropdownItem href="/messages" onClick={() => setMenuOpen(false)}>Messages</DropdownItem>
          <DropdownItem href="/my-listings" onClick={() => setMenuOpen(false)}>My Listings</DropdownItem>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
          <button
            onClick={handleSignOut}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '7px 10px', borderRadius: '6px',
              background: 'transparent', color: '#ef4444', fontSize: '13px',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Guest buttons ────────────────────────────────────────── */
function GuestButtons() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Link href="/auth/login" style={{
        padding: '6px 14px', borderRadius: '8px',
        border: '1px solid var(--color-border)', background: 'transparent',
        color: 'var(--color-muted)', fontSize: '13px', textDecoration: 'none',
        transition: 'color 0.15s ease, border-color 0.15s ease',
      }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.borderColor = 'var(--color-border-2)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
      >
        Log in
      </Link>
      <Link href="/auth/signup" style={{
        padding: '6px 14px', borderRadius: '8px',
        background: 'var(--color-blue)', color: '#fff',
        fontSize: '13px', fontWeight: 600, textDecoration: 'none',
        transition: 'background-color 0.15s ease',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-blue-dim)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-blue)')}
      >
        Sign up
      </Link>
    </div>
  )
}

/* ── Nav link helpers ─────────────────────────────────────── */
function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link href={href} style={{
      padding: '5px 12px', borderRadius: '7px', fontSize: '13px',
      fontWeight: active ? 600 : 400,
      color: active ? 'var(--color-text)' : 'var(--color-muted)',
      background: active ? 'var(--color-surface)' : 'transparent',
      textDecoration: 'none', transition: 'all 0.15s ease',
    }}>
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children, active, onClick }: {
  href: string; children: React.ReactNode; active: boolean; onClick: () => void
}) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'block', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
      fontWeight: active ? 600 : 400,
      color: active ? 'var(--color-text)' : 'var(--color-muted)',
      background: active ? 'var(--color-surface-2)' : 'transparent',
      textDecoration: 'none', transition: 'background 0.1s ease',
    }}>
      {children}
    </Link>
  )
}

function DropdownItem({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'block', padding: '7px 10px', borderRadius: '6px',
      color: 'var(--color-text)', fontSize: '13px', textDecoration: 'none',
      transition: 'background 0.1s ease',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </Link>
  )
}

/* ── Icons ────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function XSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="3" y1="6"  x2="21" y2="6"  /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function ChevronDown({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

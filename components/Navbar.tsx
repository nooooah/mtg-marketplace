'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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
        @media (max-width: 680px) {
          .nb-desktop  { display: none !important; }
          .nb-hamburger { display: flex !important; }
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
            display: 'flex', alignItems: 'center', gap: '8px',
            fontWeight: 700, fontSize: '15px', color: 'var(--color-text)',
            textDecoration: 'none', letterSpacing: '-0.02em',
            whiteSpace: 'nowrap', flexShrink: 0, flex: 1,
          }}>
            MTG<span style={{ color: 'var(--color-blue)', marginLeft: '-1px' }}>binder</span>
            <span style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--color-blue)',
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
              padding: '2px 6px', borderRadius: '5px', lineHeight: 1.4,
            }}>
              BETA
            </span>
          </Link>

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
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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

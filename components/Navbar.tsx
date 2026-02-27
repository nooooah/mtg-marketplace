'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid var(--color-border)',
      backgroundColor: 'rgba(15,15,15,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>

        {/* LEFT: Logo + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <Link href="/" style={{
            fontWeight: 700,
            fontSize: '15px',
            color: 'var(--color-text)',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            TCG<span style={{ color: 'var(--color-blue)' }}> Community</span> Market
          </Link>
          <NavSearchBar />
        </div>

        {/* RIGHT: Nav links + divider + Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <NavLink href="/events" active={isActive('/events')}>Events</NavLink>
          <NavLink href="/buy" active={isActive('/buy')}>Buy</NavLink>
          <NavLink href="/sell" active={isActive('/sell')}>Sell</NavLink>

          {/* Divider */}
          <div style={{ width: '1px', height: '16px', background: 'var(--color-border)', margin: '0 8px' }} />

          {/* Auth */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                }}
              >
                <span style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'var(--color-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {user.email?.[0]?.toUpperCase()}
                </span>
                <ChevronDown size={12} />
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  minWidth: '160px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '4px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  <DropdownItem href="/profile">My Profile</DropdownItem>
                  <DropdownItem href="/messages">Messages</DropdownItem>
                  <DropdownItem href="/my-listings">My Listings</DropdownItem>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: '13px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link href="/auth/login" style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-muted)',
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.borderColor = 'var(--color-border-2)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
              >
                Log in
              </Link>
              <Link href="/auth/signup" style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'var(--color-blue)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background-color 0.15s ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-blue-dim)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-blue)')}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}

function NavSearchBar() {
  const [value, setValue] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) router.push(`/buy?q=${encodeURIComponent(value.trim())}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '280px',
        transition: 'border-color 0.15s ease',
      }}
      onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--color-border-2)')}
      onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
    >
      <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}>
        <SearchIcon />
      </div>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Search cards…"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: '7px 0',
          fontSize: '13px',
          color: 'var(--color-text)',
          outline: 'none',
          width: '100%',
        }}
      />
    </form>
  )
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link href={href} style={{
      padding: '5px 12px',
      borderRadius: '7px',
      fontSize: '13px',
      fontWeight: active ? 600 : 400,
      color: active ? 'var(--color-text)' : 'var(--color-muted)',
      background: active ? 'var(--color-surface)' : 'transparent',
      textDecoration: 'none',
      transition: 'all 0.15s ease',
    }}>
      {children}
    </Link>
  )
}

function DropdownItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: 'block',
      padding: '7px 10px',
      borderRadius: '6px',
      color: 'var(--color-text)',
      fontSize: '13px',
      textDecoration: 'none',
      transition: 'background 0.1s ease',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </Link>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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

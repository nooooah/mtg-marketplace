'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function WaitlistPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState(false)
  const [already, setAlready] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    if (data.already) setAlready(true)
    setDone(true)
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <WaitlistIcon />
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Beleren2016', serif",
          fontSize: '28px', fontWeight: 700, color: 'var(--color-text)',
          letterSpacing: '-0.02em', margin: '0 0 12px',
        }}>
          Registration is closed
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6, margin: '0 0 36px' }}>
          MTGbinder is not accepting new accounts right now. Leave your email and we&apos;ll notify you when registration opens.
        </p>

        {done ? (
          <div style={{
            padding: '24px', borderRadius: '14px',
            background: already
              ? 'rgba(59,130,246,0.08)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${already ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
          }}>
            <p style={{
              fontSize: '20px', fontWeight: 700, margin: '0 0 6px',
              color: already ? 'var(--color-blue)' : '#34d399',
            }}>
              {already ? 'Already on the list!' : "You're on the list ✓"}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
              {already
                ? `${email} is already registered for updates.`
                : `We'll email ${email} when registration opens.`}
            </p>
          </div>
        ) : (
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '16px', padding: '28px',
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.03em' }}>
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171', fontSize: '13px', textAlign: 'left',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '11px', borderRadius: '9px', border: 'none',
                  background: loading ? 'var(--color-surface-2)' : 'var(--color-blue)',
                  color: '#fff', fontWeight: 600, fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.15s ease',
                }}
              >
                {loading ? 'Joining…' : 'Join the waitlist'}
              </button>
            </form>
          </div>
        )}

        <p style={{ marginTop: '28px', fontSize: '12px', color: 'var(--color-subtle)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function WaitlistIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  )
}

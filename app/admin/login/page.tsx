'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Invalid credentials.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      background: 'var(--color-bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              MTG<span style={{ color: 'var(--color-blue)' }}>binder</span>
            </span>
          </Link>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '6px' }}>
            Admin Console
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px', padding: '32px',
        }}>
          {/* Shield icon */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <ShieldIcon />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>
            Admin sign in
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 24px' }}>
            Restricted access — authorised personnel only.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <AdminField label="Username">
              <input
                type="text"
                placeholder="admin"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
                autoComplete="username"
              />
            </AdminField>

            <AdminField label="Password">
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </AdminField>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171', fontSize: '13px',
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
                opacity: loading ? 0.7 : 1, transition: 'all 0.15s ease', marginTop: '4px',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in to Admin'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--color-subtle)' }}>
          <Link href="/auth/login" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>
            ← Back to regular sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.03em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

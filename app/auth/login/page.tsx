'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout, ErrorAlert } from '../signup/SignUpForm'

function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', password: '' })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : signInError.message
      )
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <AuthLayout>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Email address">
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            required
            autoComplete="email"
          />
        </Field>

        <Field label="Password">
          <div>
            <input
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              required
              autoComplete="current-password"
            />
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <Link
                href="/auth/reset-password"
                style={{ fontSize: '11px', color: 'var(--color-muted)', textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </Field>

        {error && <ErrorAlert message={error} />}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '11px',
            background: loading ? 'var(--color-surface-2)' : 'var(--color-blue)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            borderRadius: '9px',
            border: 'none',
            marginTop: '4px',
            opacity: loading ? 0.7 : 1,
            transition: 'background 0.15s ease',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '24px', paddingTop: '18px', textAlign: 'center' }}>
        <Link
          href="/admin/login"
          style={{ fontSize: '12px', color: 'var(--color-subtle)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Admin sign in
        </Link>
      </div>
    </AuthLayout>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.03em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

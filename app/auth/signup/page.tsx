'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const supabase = createClient()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!form.username.trim() || form.username.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      setError('Username can only contain letters, numbers, and underscores.')
      return
    }

    setLoading(true)

    try {
      // Check username uniqueness
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', form.username.toLowerCase())
        .maybeSingle()

      if (existing) {
        setError('That username is already taken.')
        setLoading(false)
        return
      }

      // Sign up with Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: form.username.toLowerCase(),
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      setStep('verify')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--color-blue-glow)',
              border: '1px solid rgba(59,130,246,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <MailIcon />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text)' }}>
            Check your inbox
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
            We sent a verification link to <strong style={{ color: 'var(--color-text)' }}>{form.email}</strong>.
            Click the link to activate your account.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-subtle)' }}>
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              onClick={() => setStep('form')}
              style={{ background: 'none', color: 'var(--color-blue)', border: 'none', cursor: 'pointer', fontSize: '12px', padding: 0 }}
            >
              try again
            </button>.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
          Create your account
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Username" required>
          <input
            type="text"
            placeholder="e.g. cardmaster99"
            value={form.username}
            onChange={e => update('username', e.target.value)}
            required
            autoComplete="username"
          />
          <FieldHint>Letters, numbers, and underscores only. Min 3 characters.</FieldHint>
        </Field>

        <Field label="Email address" required>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            required
            autoComplete="email"
          />
        </Field>

        <Field label="Password" required>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={e => update('password', e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>

        <Field label="Confirm password" required>
          <input
            type="password"
            placeholder="Repeat your password"
            value={form.confirm}
            onChange={e => update('confirm', e.target.value)}
            required
            autoComplete="new-password"
          />
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ fontSize: '11px', color: 'var(--color-subtle)', marginTop: '20px', textAlign: 'center', lineHeight: 1.5 }}>
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </AuthLayout>
  )
}

/* ── Shared auth layout ── */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link
            href="/"
            style={{
              fontWeight: 700,
              fontSize: '15px',
              color: 'var(--color-text)',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            TCG<span style={{ color: 'var(--color-blue)' }}> Community</span> Market
          </Link>
        </div>

        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '32px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── Shared field components ── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.03em' }}>
        {label}{required && <span style={{ color: 'var(--color-blue)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '11px', color: 'var(--color-subtle)', margin: 0 }}>{children}</p>
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: '8px',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.25)',
        color: '#f87171',
        fontSize: '13px',
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  )
}

function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth={1.5}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

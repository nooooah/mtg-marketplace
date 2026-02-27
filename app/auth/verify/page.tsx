'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '../signup/page'

function VerifyContent() {
  const searchParams = useSearchParams()
  const hasError = searchParams.has('error')

  if (hasError) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <XCircleIcon />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text)' }}>
            Verification failed
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
            This verification link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/auth/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              background: 'var(--color-blue)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Back to sign up
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <CheckIcon />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text)' }}>
          Email verified!
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
          Your account has been confirmed. You can now log in and start buying and selling.
        </p>
        <Link
          href="/auth/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 20px',
            background: 'var(--color-blue)',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Go to login
        </Link>
      </div>
    </AuthLayout>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

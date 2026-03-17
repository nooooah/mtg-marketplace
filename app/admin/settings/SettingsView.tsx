'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  adminUsername: string
  adminEmail: string
  waitlistNotifyEmail: string
}

export default function SettingsView({ adminUsername, adminEmail, waitlistNotifyEmail }: Props) {
  const router = useRouter()

  // Admin account form
  const [account, setAccount] = useState({
    username: adminUsername,
    email:    adminEmail,
    password: '',
    confirm:  '',
  })
  const [accountSaving, setAccountSaving]   = useState(false)
  const [accountError, setAccountError]     = useState<string | null>(null)
  const [accountSuccess, setAccountSuccess] = useState(false)

  // Waitlist notify email
  const [notifyEmail, setNotifyEmail]     = useState(waitlistNotifyEmail)
  const [notifySaving, setNotifySaving]   = useState(false)
  const [notifySuccess, setNotifySuccess] = useState(false)

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountError(null)
    if (account.password && account.password !== account.confirm) {
      setAccountError('Passwords do not match.'); return
    }
    if (account.password && account.password.length < 6) {
      setAccountError('Password must be at least 6 characters.'); return
    }
    setAccountSaving(true)

    const body: Record<string, string> = {
      admin_username: account.username,
      admin_email:    account.email,
    }
    if (account.password) body.admin_password = account.password

    const res = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setAccountSaving(false)

    if (!res.ok) { setAccountError(data.error ?? 'Failed to save.'); return }
    setAccountSuccess(true)
    setAccount(p => ({ ...p, password: '', confirm: '' }))
    setTimeout(() => setAccountSuccess(false), 3000)
    router.refresh()
  }

  const saveNotifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotifySaving(true)
    const res = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waitlist_notify_email: notifyEmail }),
    })
    setNotifySaving(false)
    if (res.ok) {
      setNotifySuccess(true)
      setTimeout(() => setNotifySuccess(false), 3000)
      router.refresh()
    }
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
          Admin account and notification preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Admin Account ───────────────────────────────── */}
        <SettingsCard label="Admin Account">
          <form onSubmit={saveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <SettingsField label="Username">
                <input
                  value={account.username}
                  onChange={e => setAccount(p => ({ ...p, username: e.target.value }))}
                  required
                />
              </SettingsField>
              <SettingsField label="Email">
                <input
                  type="email"
                  value={account.email}
                  onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </SettingsField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <SettingsField label="New password (leave blank to keep)">
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={account.password}
                  onChange={e => setAccount(p => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                />
              </SettingsField>
              <SettingsField label="Confirm new password">
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={account.confirm}
                  onChange={e => setAccount(p => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                />
              </SettingsField>
            </div>
            {accountError && <ErrBox msg={accountError} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="submit" disabled={accountSaving} style={saveBtnStyle(accountSaving)}>
                {accountSaving ? 'Saving…' : 'Save changes'}
              </button>
              {accountSuccess && <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>✓ Saved</span>}
            </div>
          </form>
        </SettingsCard>

        {/* ── Waitlist Notifications ──────────────────────── */}
        <SettingsCard label="Waitlist Notifications">
          <form onSubmit={saveNotifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SettingsField label="Send waitlist signups to">
              <input
                type="email"
                value={notifyEmail}
                onChange={e => setNotifyEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </SettingsField>
            <p style={{ fontSize: '11px', color: 'var(--color-subtle)', margin: 0 }}>
              New waitlist emails will be recorded here for reference. Actual email delivery requires an email service integration.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="submit" disabled={notifySaving} style={saveBtnStyle(notifySaving)}>
                {notifySaving ? 'Saving…' : 'Save'}
              </button>
              {notifySuccess && <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>✓ Saved</span>}
            </div>
          </form>
        </SettingsCard>

      </div>
    </div>
  )
}

/* ─── Sub-components ──────────────────────────────────── */

function SettingsCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '16px', padding: '24px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)', margin: '0 0 18px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.03em' }}>{label}</label>
      {children}
    </div>
  )
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '13px' }}>
      {msg}
    </div>
  )
}

const saveBtnStyle = (loading: boolean): React.CSSProperties => ({
  padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
  border: 'none', background: loading ? 'var(--color-surface-2)' : 'var(--color-blue)',
  color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1, transition: 'all 0.15s ease',
})

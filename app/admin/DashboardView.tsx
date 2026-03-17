'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Stats {
  totalListings: number
  totalListingsValue: number
  totalSold: number
  totalSoldValue: number
  totalUsers: number
  waitlistCount: number
  registrationEnabled: boolean
}

interface Props {
  stats: Stats
  adminUsername: string
  adminEmail: string
  waitlistNotifyEmail: string
}

export default function DashboardView({ stats, adminUsername, adminEmail, waitlistNotifyEmail }: Props) {
  const router = useRouter()

  // Registration toggle
  const [regEnabled, setRegEnabled] = useState(stats.registrationEnabled)
  const [toggling, setToggling]     = useState(false)

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
  const [notifyEmail, setNotifyEmail]         = useState(waitlistNotifyEmail)
  const [notifySaving, setNotifySaving]       = useState(false)
  const [notifySuccess, setNotifySuccess]     = useState(false)

  const toggleRegistration = async () => {
    setToggling(true)
    const next = !regEnabled
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'registration_enabled', value: String(next) }),
    })
    if (res.ok) { setRegEnabled(next); router.refresh() }
    setToggling(false)
  }

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
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
          Site overview and controls.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Active Listings"     value={stats.totalListings.toLocaleString()}                                         icon={<ListIcon />}  color="#10b981" />
        <StatCard label="Total Listing Value" value={`₱${Math.round(stats.totalListingsValue).toLocaleString('en-PH')}`}           icon={<TagIcon />}   color="#3b82f6" />
        <StatCard label="Cards Sold"          value={stats.totalSold.toLocaleString()}                                             icon={<CheckIcon />} color="#f59e0b" />
        <StatCard label="Total Sold Value"    value={`₱${Math.round(stats.totalSoldValue).toLocaleString('en-PH')}`}               icon={<CoinsIcon />} color="#a855f7" />
        <StatCard label="Registered Users"    value={stats.totalUsers.toLocaleString()}                                            icon={<UserIcon />}  color="#06b6d4" />
        <StatCard label="Waitlist Signups"    value={stats.waitlistCount.toLocaleString()}                                         icon={<MailIcon />}  color="#f97316" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>

        {/* ── Registration toggle ─────────────────────────── */}
        <SettingsCard label="Site Settings">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)', margin: '0 0 3px' }}>
                User Registration
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
                {regEnabled ? 'New accounts can be created.' : 'Closed — visitors see the waitlist.'}
              </p>
            </div>
            <button
              onClick={toggleRegistration}
              disabled={toggling}
              aria-label="Toggle registration"
              style={{
                width: '48px', height: '26px', borderRadius: '13px', flexShrink: 0,
                background: regEnabled ? '#10b981' : 'var(--color-border)',
                border: 'none', cursor: toggling ? 'not-allowed' : 'pointer',
                position: 'relative', transition: 'background 0.2s ease',
                opacity: toggling ? 0.6 : 1,
              }}
            >
              <span style={{
                position: 'absolute', top: '3px',
                left: regEnabled ? '25px' : '3px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
          {!regEnabled && (
            <div style={{
              marginTop: '14px', padding: '10px 14px', borderRadius: '9px',
              background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
              fontSize: '12px', color: '#fb923c',
            }}>
              Waitlist page is live at <strong>/waitlist</strong>.
            </div>
          )}
        </SettingsCard>

        {/* ── Waitlist notification email ─────────────────── */}
        <SettingsCard label="Waitlist Notifications">
          <form onSubmit={saveNotifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DashField label="Send waitlist signups to">
              <input
                type="email"
                value={notifyEmail}
                onChange={e => setNotifyEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </DashField>
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

        {/* ── Admin account ───────────────────────────────── */}
        <SettingsCard label="Admin Account" wide>
          <form onSubmit={saveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <DashField label="Username">
                <input
                  value={account.username}
                  onChange={e => setAccount(p => ({ ...p, username: e.target.value }))}
                  required
                />
              </DashField>
              <DashField label="Email">
                <input
                  type="email"
                  value={account.email}
                  onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </DashField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <DashField label="New password (leave blank to keep)">
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={account.password}
                  onChange={e => setAccount(p => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                />
              </DashField>
              <DashField label="Confirm new password">
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={account.confirm}
                  onChange={e => setAccount(p => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                />
              </DashField>
            </div>
            {accountError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '13px' }}>
                {accountError}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="submit" disabled={accountSaving} style={saveBtnStyle(accountSaving)}>
                {accountSaving ? 'Saving…' : 'Save changes'}
              </button>
              {accountSuccess && <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>✓ Saved</span>}
            </div>
          </form>
        </SettingsCard>

      </div>
    </div>
  )
}

/* ─── Sub-components ───────────────────────────────────── */

function SettingsCard({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '16px', padding: '24px',
      gridColumn: wide ? 'span 2' : 'span 1',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)', margin: '0 0 16px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function DashField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.03em' }}>{label}</label>
      {children}
    </div>
  )
}

const saveBtnStyle = (loading: boolean): React.CSSProperties => ({
  padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
  border: 'none', background: loading ? 'var(--color-surface-2)' : 'var(--color-blue)',
  color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1, transition: 'all 0.15s ease',
  alignSelf: 'flex-start',
})

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: '12px' }}>
        {icon}
      </div>
      <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  )
}

function ListIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function TagIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function CoinsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg> }
function UserIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function MailIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }

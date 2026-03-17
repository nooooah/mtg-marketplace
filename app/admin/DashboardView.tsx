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

export default function DashboardView({ stats }: { stats: Stats }) {
  const router = useRouter()
  const [regEnabled, setRegEnabled] = useState(stats.registrationEnabled)
  const [toggling, setToggling]     = useState(false)

  const toggleRegistration = async () => {
    setToggling(true)
    const next = !regEnabled
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'registration_enabled', value: String(next) }),
    })
    if (res.ok) {
      setRegEnabled(next)
      router.refresh()
    }
    setToggling(false)
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
        <StatCard label="Active Listings"     value={stats.totalListings.toLocaleString()}                icon={<ListIcon />}  color="#10b981" />
        <StatCard label="Total Listing Value" value={`₱${Math.round(stats.totalListingsValue).toLocaleString('en-PH')}`} icon={<TagIcon />}   color="#3b82f6" />
        <StatCard label="Cards Sold"          value={stats.totalSold.toLocaleString()}                   icon={<CheckIcon />} color="#f59e0b" />
        <StatCard label="Total Sold Value"    value={`₱${Math.round(stats.totalSoldValue).toLocaleString('en-PH')}`}     icon={<CoinsIcon />} color="#a855f7" />
        <StatCard label="Registered Users"    value={stats.totalUsers.toLocaleString()}                  icon={<UserIcon />}  color="#06b6d4" />
        <StatCard label="Waitlist Signups"    value={stats.waitlistCount.toLocaleString()}               icon={<MailIcon />}  color="#f97316" />
      </div>

      {/* Registration control */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '16px', padding: '24px',
        maxWidth: '520px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)', margin: '0 0 14px' }}>
          Site Settings
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)', margin: '0 0 3px' }}>
              User Registration
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
              {regEnabled
                ? 'New accounts can be created.'
                : 'Registration is closed. Visitors see the waitlist page.'}
            </p>
          </div>

          {/* Toggle */}
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
            Waitlist page is live at <strong>/waitlist</strong>. Users can submit their email to be notified when registration opens.
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '14px', padding: '20px',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, marginBottom: '12px',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0, fontWeight: 500 }}>
        {label}
      </p>
    </div>
  )
}

function ListIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function TagIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function CoinsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg> }
function UserIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function MailIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }

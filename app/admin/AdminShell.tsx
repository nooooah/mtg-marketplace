'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Page = 'dashboard' | 'users'

export default function AdminShell({ children, activePage }: { children: React.ReactNode; activePage: Page }) {
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              MTG<span style={{ color: 'var(--color-blue)' }}>binder</span>
            </span>
          </Link>
          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--color-blue)',
            margin: '4px 0 0',
          }}>
            Admin Console
          </p>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <SideLink href="/admin" label="Dashboard" icon={<GridIcon />} active={activePage === 'dashboard'} />
          <SideLink href="/admin/users" label="Users" icon={<UsersIcon />} active={activePage === 'users'} />
        </nav>

        {/* Logout */}
        <div style={{ padding: '0 10px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '8px 10px', borderRadius: '8px',
              background: 'transparent', border: 'none',
              color: 'var(--color-muted)', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.12s ease',
              textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)', e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--color-muted)')}
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '36px 40px 80px' }}>
        {children}
      </main>
    </div>
  )
}

function SideLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px', borderRadius: '8px', textDecoration: 'none',
        background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
        color: active ? 'var(--color-blue)' : 'var(--color-muted)',
        fontSize: '13px', fontWeight: active ? 600 : 500,
        transition: 'all 0.12s ease',
      }}
    >
      {icon}
      {label}
    </Link>
  )
}

function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function LogoutIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}

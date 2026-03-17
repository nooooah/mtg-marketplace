'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { UserRow } from './page'

interface Props {
  users: UserRow[]
  total: number
  page: number
  perPage: number
  q: string
}

export default function UsersView({ users, total, page, perPage, q }: Props) {
  const router   = useRouter()
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const [search, setSearch] = useState(q)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modals
  const [passwordModal, setPasswordModal] = useState<UserRow | null>(null)
  const [editModal, setEditModal]         = useState<UserRow | null>(null)

  const nav = (params: Record<string, string | number>) => {
    const sp = new URLSearchParams()
    if (search) sp.set('q', search)
    sp.set('page', String(page))
    sp.set('perPage', String(perPage))
    for (const [k, v] of Object.entries(params)) sp.set(k, String(v))
    router.push(`/admin/users?${sp}`)
  }

  const onSearchChange = (v: string) => {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => nav({ q: v, page: 1 }), 400)
  }

  const toggleRestrict = async (user: UserRow) => {
    await fetch(`/api/admin/users/${user.id}/restrict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restricted: !user.restricted }),
    })
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Users
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
          {total.toLocaleString()} registered {total === 1 ? 'user' : 'users'}
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '360px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtle)', pointerEvents: 'none' }}>
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search username…"
            style={{ paddingLeft: '32px', paddingRight: '10px' }}
          />
        </div>

        {/* Per-page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>Per page:</label>
          {[10, 25, 50].map(n => (
            <button
              key={n}
              onClick={() => nav({ perPage: n, page: 1 })}
              style={{
                padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 500,
                border: `1px solid ${perPage === n ? 'var(--color-blue)' : 'var(--color-border)'}`,
                background: perPage === n ? 'rgba(59,130,246,0.1)' : 'var(--color-surface)',
                color: perPage === n ? 'var(--color-blue)' : 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '14px', overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 100px 130px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface-2)',
        }}>
          {['User', 'Joined', 'Status', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)' }}>
              {h}
            </span>
          ))}
        </div>

        {users.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--color-subtle)', padding: '32px', margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
            No users found.
          </p>
        ) : users.map((user, idx) => (
          <div
            key={user.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 100px 130px',
              padding: '12px 16px',
              alignItems: 'center',
              borderBottom: idx < users.length - 1 ? '1px solid var(--color-border)' : 'none',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* User col */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-muted)', fontSize: '12px', fontWeight: 600,
              }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user.username[0].toUpperCase()
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <Link
                  href={`/profile/${user.username}`}
                  target="_blank"
                  style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', display: 'block' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-blue)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text)')}
                >
                  {user.username} ↗
                </Link>
                <p style={{ fontSize: '11px', color: 'var(--color-subtle)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.display_name ?? <span style={{ fontStyle: 'italic' }}>No display name</span>}
                </p>
              </div>
            </div>

            {/* Joined */}
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              {new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>

            {/* Status */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
              background: user.restricted ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              color: user.restricted ? '#f87171' : '#34d399',
              width: 'fit-content',
            }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: user.restricted ? '#f87171' : '#34d399',
                flexShrink: 0,
              }} />
              {user.restricted ? 'Restricted' : 'Active'}
            </span>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <ActionBtn title="Edit profile" onClick={() => setEditModal(user)}>
                <EditIcon />
              </ActionBtn>
              <ActionBtn title="Change password" onClick={() => setPasswordModal(user)}>
                <LockIcon />
              </ActionBtn>
              <ActionBtn
                title={user.restricted ? 'Remove restriction' : 'Restrict user'}
                onClick={() => toggleRestrict(user)}
                danger={!user.restricted}
              >
                {user.restricted ? <UnlockIcon /> : <BanIcon />}
              </ActionBtn>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
          <PagBtn disabled={page <= 1} onClick={() => nav({ page: page - 1 })}>← Prev</PagBtn>
          <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <PagBtn disabled={page >= totalPages} onClick={() => nav({ page: page + 1 })}>Next →</PagBtn>
        </div>
      )}

      {/* Password modal */}
      {passwordModal && (
        <PasswordModal user={passwordModal} onClose={() => setPasswordModal(null)} />
      )}

      {/* Edit profile modal */}
      {editModal && (
        <EditProfileModal user={editModal} onClose={() => { setEditModal(null); router.refresh() }} />
      )}
    </div>
  )
}

/* ─── Password Modal ───────────────────────────────────── */
function PasswordModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [pw, setPw]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw !== confirm) { setError('Passwords do not match.'); return }
    if (pw.length < 6)  { setError('Password must be at least 6 characters.'); return }
    setError(null); setLoading(true)

    const res = await fetch(`/api/admin/users/${user.id}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Failed to update password.'); return }
    setSuccess(true)
    setTimeout(() => { onClose(); router.refresh() }, 1200)
  }

  return (
    <Modal title={`Change password — ${user.username}`} onClose={onClose}>
      {success ? (
        <p style={{ color: '#34d399', fontWeight: 600, textAlign: 'center', padding: '16px 0' }}>
          ✓ Password updated successfully.
        </p>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <ModalField label="New password">
            <input type="password" placeholder="At least 6 characters" value={pw} onChange={e => setPw(e.target.value)} required autoFocus />
          </ModalField>
          <ModalField label="Confirm password">
            <input type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </ModalField>
          {error && <ErrBox msg={error} />}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

/* ─── Edit Profile Modal ───────────────────────────────── */
function EditProfileModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [form, setForm] = useState({
    username:       user.username,
    display_name:   user.display_name ?? '',
    bio:            user.bio ?? '',
    location:       user.location ?? '',
    avatar_url:     user.avatar_url ?? '',
    messenger_link: user.messenger_link ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)

    const res = await fetch(`/api/admin/users/${user.id}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Failed to update profile.'); return }
    setSuccess(true)
    setTimeout(onClose, 1000)
  }

  return (
    <Modal title={`Edit profile — ${user.username}`} onClose={onClose} wide>
      {success ? (
        <p style={{ color: '#34d399', fontWeight: 600, textAlign: 'center', padding: '16px 0' }}>✓ Profile updated.</p>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <ModalField label="Username">
              <input value={form.username} onChange={up('username')} required autoFocus />
            </ModalField>
            <ModalField label="Display name">
              <input value={form.display_name} onChange={up('display_name')} placeholder="Optional" />
            </ModalField>
          </div>
          <ModalField label="Location">
            <input value={form.location} onChange={up('location')} placeholder="e.g. Quezon City" />
          </ModalField>
          <ModalField label="Avatar URL">
            <input value={form.avatar_url} onChange={up('avatar_url')} placeholder="https://…" />
          </ModalField>
          <ModalField label="Messenger link">
            <input value={form.messenger_link} onChange={up('messenger_link')} placeholder="e.g. https://m.me/username" />
          </ModalField>
          <ModalField label="Bio">
            <textarea
              value={form.bio}
              onChange={up('bio')}
              placeholder="Short bio…"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </ModalField>
          {error && <ErrBox msg={error} />}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

/* ─── Shared modal wrapper ─────────────────────────────── */
function Modal({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc) }
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div
        ref={ref}
        style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '16px', padding: '28px',
          width: '100%', maxWidth: wide ? '560px' : '420px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: '4px' }}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
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

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
  border: '1px solid var(--color-border)', background: 'transparent',
  color: 'var(--color-muted)', cursor: 'pointer',
}
const primaryBtnStyle = (loading: boolean): React.CSSProperties => ({
  padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
  border: 'none', background: loading ? 'var(--color-surface-2)' : 'var(--color-blue)',
  color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
})

function ActionBtn({ children, title, onClick, danger }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: '28px', height: '28px', borderRadius: '7px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? '#f87171' : 'var(--color-muted)',
        transition: 'all 0.12s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : 'var(--color-surface-2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)' }}
    >
      {children}
    </button>
  )
}

function PagBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
        border: '1px solid var(--color-border)',
        background: disabled ? 'var(--color-surface-2)' : 'var(--color-surface)',
        color: disabled ? 'var(--color-subtle)' : 'var(--color-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// Icons
function SearchIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function EditIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function LockIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> }
function BanIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> }
function UnlockIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> }
function CloseIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }

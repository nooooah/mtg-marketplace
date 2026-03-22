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
  const [emblemModal, setEmblemModal]     = useState<UserRow | null>(null)
  const [inviteOpen, setInviteOpen]       = useState(false)

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Users
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
            {total.toLocaleString()} registered {total === 1 ? 'user' : 'users'}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '9px', border: 'none',
            background: 'var(--color-blue)', color: '#fff',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <PlusIcon />
          Invite user
        </button>
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
          gridTemplateColumns: '1fr 160px 140px 100px 130px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface-2)',
        }}>
          {['User', 'Emblems', 'Joined', 'Status', 'Actions'].map(h => (
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
              gridTemplateColumns: '1fr 160px 140px 100px 130px',
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

            {/* Emblems */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {(user.emblems ?? []).map((e, i) => (
                <i
                  key={i}
                  className={`ss ss-${e.set} ss-${e.rarity} ss-grad`}
                  title={`${e.set.toUpperCase()} · ${e.rarity}`}
                  style={{ fontSize: '18px', lineHeight: 1 }}
                />
              ))}
              <button
                onClick={() => setEmblemModal(user)}
                title="Manage emblems"
                style={{
                  width: '22px', height: '22px', borderRadius: '6px',
                  border: '1px dashed var(--color-border)',
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-subtle)', fontSize: '14px', lineHeight: 1,
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-blue)'; e.currentTarget.style.color = 'var(--color-blue)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-subtle)' }}
              >
                +
              </button>
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

      {/* Invite modal */}
      {inviteOpen && (
        <InviteModal onClose={() => { setInviteOpen(false); router.refresh() }} />
      )}

      {/* Password modal */}
      {passwordModal && (
        <PasswordModal user={passwordModal} onClose={() => setPasswordModal(null)} />
      )}

      {/* Edit profile modal */}
      {editModal && (
        <EditProfileModal user={editModal} onClose={() => { setEditModal(null); router.refresh() }} />
      )}

      {/* Emblems modal */}
      {emblemModal && (
        <EmblemModal user={emblemModal} onClose={() => { setEmblemModal(null); router.refresh() }} />
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

/* ─── Invite Modal ─────────────────────────────────────── */
function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Failed to send invitation.'); return }
    setSuccess(true)
  }

  return (
    <Modal title="Invite user" onClose={onClose}>
      {success ? (
        <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', margin: '0 0 6px' }}>
            Invitation sent!
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 20px' }}>
            An invite email has been sent to <strong style={{ color: 'var(--color-text)' }}>{email}</strong>. They&apos;ll receive a link to set their password and join.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => { setEmail(''); setSuccess(false); setError(null) }}
              style={cancelBtnStyle}
            >
              Invite another
            </button>
            <button onClick={onClose} style={primaryBtnStyle(false)}>Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
            Enter the email address of the person you want to invite. They&apos;ll receive an email with a link to set their password and access the platform.
          </p>
          <ModalField label="Email address">
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </ModalField>
          {error && <ErrBox msg={error} />}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? 'Sending…' : 'Send invitation'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

/* ─── Keyrune sets list ────────────────────────────────────── */
const KEYRUNE_SETS = [
  // Early/Classic
  { code: 'lea', name: 'Alpha' }, { code: 'leb', name: 'Beta' }, { code: '2ed', name: 'Unlimited' },
  { code: '3ed', name: 'Revised' }, { code: '4ed', name: 'Fourth Edition' }, { code: '5ed', name: 'Fifth Edition' },
  { code: '6ed', name: 'Classic Sixth Edition' }, { code: '7ed', name: 'Seventh Edition' },
  { code: '8ed', name: 'Eighth Edition' }, { code: '9ed', name: 'Ninth Edition' }, { code: '10e', name: 'Tenth Edition' },
  { code: 'arn', name: 'Arabian Nights' }, { code: 'atq', name: 'Antiquities' }, { code: 'leg', name: 'Legends' },
  { code: 'drk', name: 'The Dark' }, { code: 'fem', name: 'Fallen Empires' },
  // Ice Age block
  { code: 'ice', name: 'Ice Age' }, { code: 'all', name: 'Alliances' }, { code: 'hml', name: 'Homelands' }, { code: 'csp', name: 'Coldsnap' },
  // Mirage block
  { code: 'mir', name: 'Mirage' }, { code: 'vis', name: 'Visions' }, { code: 'wth', name: 'Weatherlight' },
  // Tempest block
  { code: 'tmp', name: 'Tempest' }, { code: 'sth', name: 'Stronghold' }, { code: 'exo', name: 'Exodus' },
  // Urza block
  { code: 'usg', name: "Urza's Saga" }, { code: 'ulg', name: "Urza's Legacy" }, { code: 'uds', name: "Urza's Destiny" },
  // Masques block
  { code: 'mmq', name: 'Mercadian Masques' }, { code: 'nem', name: 'Nemesis' }, { code: 'pcy', name: 'Prophecy' },
  // Invasion block
  { code: 'inv', name: 'Invasion' }, { code: 'pls', name: 'Planeshift' }, { code: 'apc', name: 'Apocalypse' },
  // Odyssey block
  { code: 'ody', name: 'Odyssey' }, { code: 'tor', name: 'Torment' }, { code: 'jud', name: 'Judgment' },
  // Onslaught block
  { code: 'ons', name: 'Onslaught' }, { code: 'lgn', name: 'Legions' }, { code: 'scg', name: 'Scourge' },
  // Mirrodin block
  { code: 'mrd', name: 'Mirrodin' }, { code: 'dst', name: 'Darksteel' }, { code: '5dn', name: 'Fifth Dawn' },
  // Kamigawa block
  { code: 'chk', name: 'Champions of Kamigawa' }, { code: 'bok', name: 'Betrayers of Kamigawa' }, { code: 'sok', name: 'Saviors of Kamigawa' },
  // Ravnica block
  { code: 'rav', name: 'Ravnica: City of Guilds' }, { code: 'gpt', name: 'Guildpact' }, { code: 'dis', name: 'Dissension' },
  // Time Spiral block
  { code: 'tsp', name: 'Time Spiral' }, { code: 'plc', name: 'Planar Chaos' }, { code: 'fut', name: 'Future Sight' },
  // Lorwyn/Shadowmoor
  { code: 'lrw', name: 'Lorwyn' }, { code: 'mor', name: 'Morningtide' }, { code: 'shm', name: 'Shadowmoor' }, { code: 'eve', name: 'Eventide' },
  // Alara block
  { code: 'ala', name: 'Shards of Alara' }, { code: 'con', name: 'Conflux' }, { code: 'arb', name: 'Alara Reborn' },
  // Zendikar block
  { code: 'zen', name: 'Zendikar' }, { code: 'wwk', name: 'Worldwake' }, { code: 'roe', name: 'Rise of the Eldrazi' },
  // Scars of Mirrodin block
  { code: 'som', name: 'Scars of Mirrodin' }, { code: 'mbs', name: 'Mirrodin Besieged' }, { code: 'nph', name: 'New Phyrexia' },
  // Innistrad block
  { code: 'isd', name: 'Innistrad' }, { code: 'dka', name: 'Dark Ascension' }, { code: 'avr', name: 'Avacyn Restored' },
  // Return to Ravnica block
  { code: 'rtr', name: 'Return to Ravnica' }, { code: 'gtc', name: 'Gatecrash' }, { code: 'dgm', name: "Dragon's Maze" },
  // Theros block
  { code: 'ths', name: 'Theros' }, { code: 'bng', name: 'Born of the Gods' }, { code: 'jou', name: 'Journey into Nyx' },
  // Khans block
  { code: 'ktk', name: 'Khans of Tarkir' }, { code: 'frf', name: 'Fate Reforged' }, { code: 'dtk', name: 'Dragons of Tarkir' },
  // Battle for Zendikar block
  { code: 'bfz', name: 'Battle for Zendikar' }, { code: 'ogw', name: 'Oath of the Gatewatch' },
  // Shadows over Innistrad block
  { code: 'soi', name: 'Shadows over Innistrad' }, { code: 'emn', name: 'Eldritch Moon' },
  // Kaladesh block
  { code: 'kld', name: 'Kaladesh' }, { code: 'aer', name: 'Aether Revolt' },
  // Amonkhet block
  { code: 'akh', name: 'Amonkhet' }, { code: 'hou', name: 'Hour of Devastation' },
  // Ixalan block
  { code: 'xln', name: 'Ixalan' }, { code: 'rix', name: 'Rivals of Ixalan' },
  // Core sets (M10–M21)
  { code: 'm10', name: 'Magic 2010' }, { code: 'm11', name: 'Magic 2011' }, { code: 'm12', name: 'Magic 2012' },
  { code: 'm13', name: 'Magic 2013' }, { code: 'm14', name: 'Magic 2014' }, { code: 'm15', name: 'Magic 2015' },
  { code: 'ori', name: 'Magic Origins' }, { code: 'm19', name: 'Core Set 2019' }, { code: 'm20', name: 'Core Set 2020' }, { code: 'm21', name: 'Core Set 2021' },
  // Standard-era sets
  { code: 'dom', name: 'Dominaria' }, { code: 'grn', name: 'Guilds of Ravnica' }, { code: 'rna', name: 'Ravnica Allegiance' },
  { code: 'war', name: 'War of the Spark' }, { code: 'eld', name: 'Throne of Eldraine' }, { code: 'thb', name: 'Theros Beyond Death' },
  { code: 'iko', name: 'Ikoria: Lair of Behemoths' }, { code: 'znr', name: 'Zendikar Rising' }, { code: 'khm', name: 'Kaldheim' },
  { code: 'stx', name: 'Strixhaven: School of Mages' }, { code: 'afr', name: 'Adventures in the Forgotten Realms' },
  { code: 'mid', name: 'Innistrad: Midnight Hunt' }, { code: 'vow', name: 'Innistrad: Crimson Vow' },
  { code: 'neo', name: 'Kamigawa: Neon Dynasty' }, { code: 'snc', name: 'Streets of New Capenna' },
  { code: 'dmu', name: 'Dominaria United' }, { code: 'bro', name: "The Brothers' War" },
  { code: 'one', name: 'Phyrexia: All Will Be One' }, { code: 'mom', name: 'March of the Machine' },
  { code: 'woe', name: 'Wilds of Eldraine' }, { code: 'lci', name: 'The Lost Caverns of Ixalan' },
  { code: 'mkm', name: 'Murders at Karlov Manor' }, { code: 'otj', name: 'Outlaws of Thunder Junction' },
  { code: 'blb', name: 'Bloomburrow' }, { code: 'dsk', name: 'Duskmourn: House of Horror' }, { code: 'fdn', name: 'Foundations' },
  // Special / Masters
  { code: 'cmd', name: 'Commander' }, { code: 'mma', name: 'Modern Masters' }, { code: 'mm2', name: 'Modern Masters 2015' },
  { code: 'mm3', name: 'Modern Masters 2017' }, { code: 'ema', name: 'Eternal Masters' }, { code: 'ima', name: 'Iconic Masters' },
  { code: 'a25', name: 'Masters 25' }, { code: 'uma', name: 'Ultimate Masters' },
  { code: '2xm', name: 'Double Masters' }, { code: '2x2', name: 'Double Masters 2022' },
  { code: 'dmr', name: 'Dominaria Remastered' }, { code: 'moc', name: 'March of the Machine Commander' },
]

const RARITIES = ['common', 'uncommon', 'rare', 'mythic'] as const
type EmblemRarity = typeof RARITIES[number]
const RARITY_COLORS: Record<EmblemRarity, string> = {
  common:   '#aaa',
  uncommon: '#8c9dc0',
  rare:     '#c5a84e',
  mythic:   '#e8834a',
}

/* ─── Emblem Modal ─────────────────────────────────────────── */
function EmblemModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [emblems, setEmblems] = useState<{ set: string; rarity: string }[]>(user.emblems ?? [])
  const [setSearch, setSetSearch] = useState('')
  const [selectedSet, setSelectedSet] = useState<string>('')
  const [selectedRarity, setSelectedRarity] = useState<EmblemRarity>('mythic')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSetDropdown, setShowSetDropdown] = useState(false)
  const setDropdownRef = useRef<HTMLDivElement>(null)

  const filteredSets = KEYRUNE_SETS.filter(s =>
    s.name.toLowerCase().includes(setSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(setSearch.toLowerCase())
  ).slice(0, 60)

  // Close set dropdown on outside click
  useEffect(() => {
    if (!showSetDropdown) return
    const handler = (e: MouseEvent) => {
      if (setDropdownRef.current && !setDropdownRef.current.contains(e.target as Node)) setShowSetDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSetDropdown])

  const addEmblem = () => {
    if (!selectedSet) return
    // Avoid exact duplicates
    if (emblems.some(e => e.set === selectedSet && e.rarity === selectedRarity)) return
    setEmblems(prev => [...prev, { set: selectedSet, rarity: selectedRarity }])
  }

  const removeEmblem = (idx: number) => {
    setEmblems(prev => prev.filter((_, i) => i !== idx))
  }

  const save = async () => {
    setSaving(true); setError(null)
    const res = await fetch(`/api/admin/users/${user.id}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emblems }),
    })
    setSaving(false)
    if (!res.ok) { setError('Failed to save emblems.'); return }
    onClose()
  }

  const selectedSetObj = KEYRUNE_SETS.find(s => s.code === selectedSet)

  return (
    <Modal title={`Emblems — ${user.username}`} onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Current emblems */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Current emblems
          </p>
          {emblems.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-subtle)', fontStyle: 'italic' }}>No emblems yet.</p>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {emblems.map((e, i) => {
                const setObj = KEYRUNE_SETS.find(s => s.code === e.set)
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '5px 9px', borderRadius: '8px',
                    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  }}>
                    <i className={`ss ss-${e.set} ss-${e.rarity} ss-grad`} style={{ fontSize: '20px', lineHeight: 1 }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2 }}>
                        {setObj?.name ?? e.set.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '10px', color: RARITY_COLORS[e.rarity as EmblemRarity] ?? 'var(--color-muted)', textTransform: 'capitalize', lineHeight: 1.2 }}>
                        {e.rarity}
                      </div>
                    </div>
                    <button
                      onClick={() => removeEmblem(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: '2px', lineHeight: 1, marginLeft: '2px' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-subtle)')}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add emblem */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Add emblem
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Set picker */}
            <div style={{ flex: '1 1 200px', minWidth: 0 }} ref={setDropdownRef}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '5px' }}>Set</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={selectedSet ? `${selectedSetObj?.name ?? selectedSet} (${selectedSet})` : setSearch}
                  placeholder="Search set name or code…"
                  onFocus={() => { setShowSetDropdown(true); if (selectedSet) { setSelectedSet(''); setSetSearch('') } }}
                  onChange={e => { setSetSearch(e.target.value); setSelectedSet(''); setShowSetDropdown(true) }}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                {showSetDropdown && filteredSets.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    maxHeight: '220px', overflowY: 'auto', zIndex: 200,
                  }}>
                    {filteredSets.map(s => (
                      <button
                        key={s.code}
                        onMouseDown={e => {
                          e.preventDefault()
                          setSelectedSet(s.code)
                          setSetSearch('')
                          setShowSetDropdown(false)
                        }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 12px',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '10px',
                          color: 'var(--color-text)', fontSize: '13px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <i className={`ss ss-${s.code} ss-${selectedRarity} ss-grad`} style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }} />
                        <span style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          <span style={{ color: 'var(--color-subtle)', fontSize: '11px', marginLeft: '5px' }}>{s.code}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rarity picker */}
            <div style={{ flexShrink: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '5px' }}>Rarity</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {RARITIES.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRarity(r)}
                    style={{
                      padding: '6px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                      border: `1px solid ${selectedRarity === r ? RARITY_COLORS[r] : 'var(--color-border)'}`,
                      background: selectedRarity === r ? `${RARITY_COLORS[r]}18` : 'transparent',
                      color: selectedRarity === r ? RARITY_COLORS[r] : 'var(--color-muted)',
                      cursor: 'pointer', textTransform: 'capitalize',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview + Add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
            {selectedSet ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '9px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <i className={`ss ss-${selectedSet} ss-${selectedRarity} ss-grad`} style={{ fontSize: '28px', lineHeight: 1 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{selectedSetObj?.name}</div>
                  <div style={{ fontSize: '11px', color: RARITY_COLORS[selectedRarity], textTransform: 'capitalize' }}>{selectedRarity}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px 12px', borderRadius: '9px', background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)', color: 'var(--color-subtle)', fontSize: '13px' }}>
                Select a set to preview
              </div>
            )}
            <button
              onClick={addEmblem}
              disabled={!selectedSet}
              style={{
                padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                background: selectedSet ? 'var(--color-blue)' : 'var(--color-surface-2)',
                color: selectedSet ? '#fff' : 'var(--color-subtle)',
                border: 'none', cursor: selectedSet ? 'pointer' : 'not-allowed',
                transition: 'all 0.12s ease',
              }}
            >
              Add emblem
            </button>
          </div>
        </div>

        {/* Footer */}
        {error && <ErrBox msg={error} />}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={save} disabled={saving} style={primaryBtnStyle(saving)}>
            {saving ? 'Saving…' : 'Save emblems'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Icons
function PlusIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function SearchIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function EditIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function LockIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> }
function BanIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> }
function UnlockIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> }
function CloseIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }

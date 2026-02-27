'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MessageButton({
  listingId,
  sellerId,
  sellerUsername,
}: {
  listingId: string
  sellerId: string
  sellerUsername: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const handleClick = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/auth/login?redirect=/listing/${listingId}`)
      return
    }
    if (user.id === sellerId) return // Can't message yourself
    router.push(`/messages?listing=${listingId}&to=${sellerId}`)
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '13px',
        background: 'var(--color-blue)',
        color: '#fff',
        fontWeight: 600,
        fontSize: '15px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-blue-dim)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-blue)')}
    >
      <MessageIcon />
      Message {sellerUsername}
    </button>
  )
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

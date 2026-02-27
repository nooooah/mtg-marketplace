'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Message, Profile } from '@/types'

interface Thread {
  otherUser: Profile
  lastMessage: Message
  unread: number
}

function MessagesContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toParam = searchParams.get('to')
  const listingParam = searchParams.get('listing')

  const [userId, setUserId] = useState<string | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<string | null>(toParam)
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login?redirect=/messages'); return }
      setUserId(user.id)
    })
  }, [])

  // Load threads
  useEffect(() => {
    if (!userId) return
    loadThreads()
  }, [userId])

  // Load messages for active thread
  useEffect(() => {
    if (!userId || !activeThread) return
    loadMessages(activeThread)
    loadProfile(activeThread)
  }, [userId, activeThread])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      }, () => {
        loadThreads()
        if (activeThread) loadMessages(activeThread)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, activeThread])

  const loadThreads = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(id,username,avatar_url,created_at), receiver:profiles!receiver_id(id,username,avatar_url,created_at)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (!data) return

    // Group by conversation partner
    const threadMap = new Map<string, Thread>()
    for (const msg of data) {
      const other = msg.sender_id === userId ? msg.receiver : msg.sender
      if (!other || threadMap.has(other.id)) continue
      threadMap.set(other.id, {
        otherUser: other as Profile,
        lastMessage: msg as Message,
        unread: data.filter(m => m.sender_id === other.id && m.receiver_id === userId && !m.read).length,
      })
    }
    setThreads(Array.from(threadMap.values()))
    setLoading(false)
  }

  const loadMessages = async (otherUserId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })

    setMessages((data as Message[]) ?? [])

    // Mark received messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', userId)
      .eq('read', false)
  }

  const loadProfile = async (otherUserId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)
      .single()
    if (data) setActiveProfile(data as Profile)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userId || !activeThread || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')
    await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: activeThread,
      listing_id: listingParam || null,
      content,
    })
    loadMessages(activeThread)
    loadThreads()
    setSending(false)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!userId) return null

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 1.5rem 0', height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>

      <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: '20px' }}>
        Messages
      </h1>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden', minHeight: 0 }}>

        {/* Thread list */}
        <div style={{ borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Conversations</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', color: 'var(--color-muted)', fontSize: '13px', textAlign: 'center' }}>Loading…</div>
            ) : threads.length === 0 ? (
              <div style={{ padding: '32px 16px', color: 'var(--color-muted)', fontSize: '13px', textAlign: 'center', lineHeight: 1.6 }}>
                No messages yet.<br />
                <span style={{ color: 'var(--color-subtle)' }}>Message a seller from any listing.</span>
              </div>
            ) : (
              threads.map(thread => (
                <button
                  key={thread.otherUser.id}
                  onClick={() => setActiveThread(thread.otherUser.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '14px 16px',
                    background: activeThread === thread.otherUser.id ? 'var(--color-surface-2)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {thread.otherUser.username[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: thread.unread > 0 ? 700 : 500, fontSize: '13px', color: 'var(--color-text)' }}>
                        {thread.otherUser.username}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-subtle)' }}>
                        {formatTime(thread.lastMessage.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {thread.lastMessage.content}
                    </p>
                  </div>
                  {thread.unread > 0 && (
                    <span style={{ background: 'var(--color-blue)', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      {thread.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message pane */}
        {activeThread && activeProfile ? (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                {activeProfile.username[0].toUpperCase()}
              </div>
              <Link href={`/profile/${activeProfile.username}`} style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)', textDecoration: 'none' }}>
                {activeProfile.username}
              </Link>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map(msg => {
                const isMine = msg.sender_id === userId
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '10px 14px',
                      borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMine ? 'var(--color-blue)' : 'var(--color-surface-2)',
                      color: isMine ? '#fff' : 'var(--color-text)',
                      fontSize: '14px',
                      lineHeight: 1.5,
                    }}>
                      <p style={{ margin: 0 }}>{msg.content}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.65, textAlign: 'right' }}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{ padding: '14px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={`Message ${activeProfile.username}…`}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', fontSize: '14px' }}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                style={{
                  padding: '10px 18px',
                  background: newMessage.trim() ? 'var(--color-blue)' : 'var(--color-surface-2)',
                  color: newMessage.trim() ? '#fff' : 'var(--color-muted)',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                Send
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: '14px', flexDirection: 'column', gap: '8px' }}>
            <MessageIcon />
            <span>Select a conversation</span>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} style={{ color: 'var(--color-border-2)' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
}

export default function MessagesPage() {
  return <Suspense><MessagesContent /></Suspense>
}

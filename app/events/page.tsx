import { createClient } from '@/lib/supabase/server'
import type { Event } from '@/types'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const revalidate = 60

async function getEvents(): Promise<Event[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
    return (data as Event[]) ?? []
  } catch {
    return []
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) >= new Date()
}

export default async function EventsPage() {
  const events = await getEvents()
  const upcoming = events.filter(e => isUpcoming(e.date))
  const past = events.filter(e => !isUpcoming(e.date))

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 1.5rem 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-blue)', marginBottom: '10px' }}>
          Community
        </p>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
          Events
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
          Tournaments, draft nights, commander pods, and more.
        </p>
      </div>

      {/* Upcoming */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Upcoming
        </h2>

        {upcoming.length === 0 ? (
          <EmptyState label="No upcoming events. Check back soon!" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcoming.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-subtle)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Past Events
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: 0.6 }}>
            {past.map(event => <EventCard key={event.id} event={event} past />)}
          </div>
        </section>
      )}
    </div>
  )
}

function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        padding: '20px 24px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        alignItems: 'flex-start',
      }}
    >
      {/* Date block */}
      <div
        style={{
          flexShrink: 0,
          width: '52px',
          textAlign: 'center',
          background: past ? 'var(--color-surface-2)' : 'var(--color-blue-glow)',
          border: `1px solid ${past ? 'var(--color-border)' : 'rgba(59,130,246,0.25)'}`,
          borderRadius: '10px',
          padding: '8px 6px',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: past ? 'var(--color-subtle)' : 'var(--color-blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: past ? 'var(--color-muted)' : 'var(--color-text)', lineHeight: 1.1 }}>
          {new Date(event.date).getDate()}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.3 }}>
          {event.title}
        </h3>
        {event.description && (
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
            {event.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <MetaItem icon={<ClockIcon />} label={`${formatDate(event.date)} · ${formatTime(event.date)}`} />
          {event.location && <MetaItem icon={<LocationIcon />} label={event.location} />}
        </div>
      </div>
    </div>
  )
}

function MetaItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-muted)' }}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-muted)', fontSize: '14px' }}>
      {label}
    </div>
  )
}

function ClockIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function LocationIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
}

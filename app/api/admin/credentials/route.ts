import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isAdminAuthed(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'mtgbinder_admin_authenticated'
}

async function upsertSetting(admin: ReturnType<typeof createAdminClient>, key: string, value: string) {
  return admin
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()
  const errors: string[] = []

  // Update username if provided
  if (body.admin_username?.trim()) {
    const { error } = await upsertSetting(admin, 'admin_username', body.admin_username.trim())
    if (error) errors.push(`username: ${error.message}`)
  }

  // Update password if provided
  if (body.admin_password?.trim()) {
    if (body.admin_password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }
    const { error } = await upsertSetting(admin, 'admin_password', body.admin_password.trim())
    if (error) errors.push(`password: ${error.message}`)
  }

  // Update admin email if provided
  if (body.admin_email?.trim()) {
    const { error } = await upsertSetting(admin, 'admin_email', body.admin_email.trim())
    if (error) errors.push(`email: ${error.message}`)
  }

  // Update waitlist notification email if provided
  if ('waitlist_notify_email' in body) {
    const { error } = await upsertSetting(admin, 'waitlist_notify_email', body.waitlist_notify_email?.trim() ?? '')
    if (error) errors.push(`waitlist email: ${error.message}`)
  }

  if (errors.length) return NextResponse.json({ error: errors.join('; ') }, { status: 500 })
  return NextResponse.json({ ok: true })
}

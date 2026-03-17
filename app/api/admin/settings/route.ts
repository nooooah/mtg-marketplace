import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isAdminAuthed(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'mtgbinder_admin_authenticated'
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, value } = await req.json()
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('app_settings')
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

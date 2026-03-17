import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isAdminAuthed(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'mtgbinder_admin_authenticated'
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Only allow safe profile fields to be updated
  const allowed = ['username', 'bio', 'avatar_url', 'display_name', 'location', 'preferred_lgs', 'messenger_link']
  const updates: Record<string, string> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

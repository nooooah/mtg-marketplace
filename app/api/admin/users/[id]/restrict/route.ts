import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isAdminAuthed(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'mtgbinder_admin_authenticated'
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { restricted } = await req.json()

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ restricted: !!restricted })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

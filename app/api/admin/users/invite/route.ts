import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isAdminAuthed(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'mtgbinder_admin_authenticated'
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback`,
  })

  if (error) {
    // Supabase returns this error when the user already exists
    if (error.message.toLowerCase().includes('already been registered')) {
      return NextResponse.json({ error: 'That email is already registered.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

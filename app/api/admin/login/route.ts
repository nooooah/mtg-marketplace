import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const COOKIE_NAME  = 'admin_session'
const COOKIE_VALUE = 'mtgbinder_admin_authenticated'

// Fallback hardcoded credentials (used if app_settings rows don't exist yet)
const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'mtgAdmin123!'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    // Read credentials from app_settings; fall back to defaults
    let expectedUsername = DEFAULT_USERNAME
    let expectedPassword = DEFAULT_PASSWORD

    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from('app_settings')
        .select('key, value')
        .in('key', ['admin_username', 'admin_password'])

      for (const row of data ?? []) {
        if (row.key === 'admin_username') expectedUsername = row.value
        if (row.key === 'admin_password') expectedPassword = row.value
      }
    } catch {
      // If DB read fails, fall back to hardcoded defaults
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}

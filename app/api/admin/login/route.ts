import { NextRequest, NextResponse } from 'next/server'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'mtgAdmin123!'
const COOKIE_NAME   = 'admin_session'
const COOKIE_VALUE  = 'mtgbinder_admin_authenticated'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
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

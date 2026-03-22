import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_COOKIE = 'admin_session'
const ADMIN_VALUE  = 'mtgbinder_admin_authenticated'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_COOKIE)?.value
  return NextResponse.json({ isAdmin: session === ADMIN_VALUE })
}

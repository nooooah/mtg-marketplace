import { createAdminClient } from '@/lib/supabase/admin'
import AdminShell from '../AdminShell'
import UsersView from './UsersView'

export default async function AdminUsersPage(
  { searchParams }: { searchParams: Promise<{ page?: string; perPage?: string; q?: string }> }
) {
  const sp      = await searchParams
  const page    = Math.max(1, parseInt(sp.page ?? '1') || 1)
  const perPage = [10, 25, 50].includes(parseInt(sp.perPage ?? '')) ? parseInt(sp.perPage!) : 25
  const q       = sp.q?.trim() ?? ''

  const admin  = createAdminClient()
  const from   = (page - 1) * perPage
  const to     = from + perPage - 1

  let query = admin
    .from('profiles')
    .select('id, username, bio, avatar_url, display_name, location, messenger_link, restricted, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) query = query.ilike('username', `%${q}%`)

  const { data, count } = await query

  return (
    <AdminShell activePage="users">
      <UsersView
        users={(data ?? []) as UserRow[]}
        total={count ?? 0}
        page={page}
        perPage={perPage}
        q={q}
      />
    </AdminShell>
  )
}

export interface UserRow {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  display_name: string | null
  location: string | null
  messenger_link: string | null
  restricted: boolean
  created_at: string
}

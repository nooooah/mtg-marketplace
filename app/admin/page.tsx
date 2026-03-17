import { createAdminClient } from '@/lib/supabase/admin'
import AdminShell from './AdminShell'

export default async function AdminDashboard() {
  const admin = createAdminClient()

  // ── Stats ───────────────────────────────────────────────
  const [listingsRes, soldRes, usersRes, settingsRes, waitlistRes] = await Promise.all([
    admin.from('listings').select('price, quantity', { count: 'exact' }).neq('status', 'sold'),
    admin.from('listings').select('price, quantity', { count: 'exact' }).eq('status', 'sold'),
    admin.from('profiles').select('id', { count: 'exact' }),
    admin.from('app_settings').select('key, value'),
    admin.from('waitlist').select('id', { count: 'exact' }),
  ])

  const totalListings       = listingsRes.count ?? 0
  const totalListingsValue  = (listingsRes.data ?? []).reduce((s, r) => s + (Number(r.price) * Number(r.quantity)), 0)
  const totalSold           = soldRes.count ?? 0
  const totalSoldValue      = (soldRes.data ?? []).reduce((s, r) => s + (Number(r.price) * Number(r.quantity)), 0)
  const totalUsers          = usersRes.count ?? 0
  const waitlistCount       = waitlistRes.count ?? 0

  const settings: Record<string, string> = {}
  for (const row of settingsRes.data ?? []) settings[row.key] = row.value

  const registrationEnabled = settings['registration_enabled'] !== 'false'

  return (
    <AdminShell activePage="dashboard">
      <DashboardView
        stats={{
          totalListings,
          totalListingsValue,
          totalSold,
          totalSoldValue,
          totalUsers,
          waitlistCount,
          registrationEnabled,
        }}
      />
    </AdminShell>
  )
}

/* ─── Client island for registration toggle ────────────── */
import DashboardView from './DashboardView'

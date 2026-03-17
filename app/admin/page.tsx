import { createAdminClient } from '@/lib/supabase/admin'
import AdminShell from './AdminShell'
import DashboardView from './DashboardView'

export default async function AdminDashboard() {
  const admin = createAdminClient()

  const [listingsRes, soldRes, usersRes, settingsRes, waitlistRes] = await Promise.all([
    admin.from('listings').select('price, quantity', { count: 'exact' }).neq('status', 'sold'),
    admin.from('listings').select('price, quantity', { count: 'exact' }).eq('status', 'sold'),
    admin.from('profiles').select('id', { count: 'exact' }),
    admin.from('app_settings').select('key, value').eq('key', 'registration_enabled'),
    admin.from('waitlist').select('id', { count: 'exact' }),
  ])

  const totalListings      = listingsRes.count ?? 0
  const totalListingsValue = (listingsRes.data ?? []).reduce((s, r) => s + (Number(r.price) * Number(r.quantity)), 0)
  const totalSold          = soldRes.count ?? 0
  const totalSoldValue     = (soldRes.data ?? []).reduce((s, r) => s + (Number(r.price) * Number(r.quantity)), 0)
  const totalUsers         = usersRes.count ?? 0
  const waitlistCount      = waitlistRes.count ?? 0

  const regSetting         = settingsRes.data?.[0]?.value
  const registrationEnabled = regSetting !== 'false'

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

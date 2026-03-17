import { createAdminClient } from '@/lib/supabase/admin'
import AdminShell from '../AdminShell'
import SettingsView from './SettingsView'

export default async function AdminSettingsPage() {
  const admin = createAdminClient()

  const { data } = await admin.from('app_settings').select('key, value')

  const settings: Record<string, string> = {}
  for (const row of data ?? []) settings[row.key] = row.value

  return (
    <AdminShell activePage="settings">
      <SettingsView
        adminUsername={settings['admin_username'] ?? 'admin'}
        adminEmail={settings['admin_email'] ?? 'noah.loyola@gmail.com'}
        waitlistNotifyEmail={settings['waitlist_notify_email'] ?? ''}
      />
    </AdminShell>
  )
}

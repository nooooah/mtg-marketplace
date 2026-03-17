import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignUpForm from './SignUpForm'

export default async function SignUpPage() {
  const supabase = await createClient()

  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'registration_enabled')
    .maybeSingle()

  // If setting doesn't exist yet (pre-migration) we allow signup
  const registrationEnabled = setting?.value !== 'false'

  if (!registrationEnabled) {
    redirect('/waitlist')
  }

  return <SignUpForm />
}

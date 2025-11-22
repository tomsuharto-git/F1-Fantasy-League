import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  // Otherwise redirect to signin
  redirect('/signin');
}

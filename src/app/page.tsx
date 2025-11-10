'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/client';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is logged in
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // User is logged in, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not logged in, redirect to signin
        router.push('/signin');
      }
    }

    checkAuth();
  }, [router, supabase]);

  // Show loading state while checking auth
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </main>
  );
}

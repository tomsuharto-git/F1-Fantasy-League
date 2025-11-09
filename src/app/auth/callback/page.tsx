'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleAuthCallback } from '@/lib/auth/upgrade';

export default function AuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    async function processCallback() {
      try {
        await handleAuthCallback();
        
        const lastLeague = localStorage.getItem('last_league_id');
        if (lastLeague) {
          router.push(`/league/${lastLeague}`);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth callback failed:', error);
        router.push('/?error=auth_failed');
      }
    }
    
    processCallback();
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🏎️</div>
        <div className="text-xl">Signing you in...</div>
      </div>
    </div>
  );
}

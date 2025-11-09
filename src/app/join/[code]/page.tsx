'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getLeagueByShareCode } from '@/lib/league/operations';
import { JoinLeague } from '@/components/auth/JoinLeague';
import type { League } from '@/lib/types';

export default function JoinPage() {
  const params = useParams();
  const code = params.code as string;

  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeague() {
      try {
        setLoading(true);
        setError(null);

        const leagueData = await getLeagueByShareCode(code);

        if (!leagueData) {
          setError('League not found. Check your share code and try again.');
          return;
        }

        setLeague(leagueData);
      } catch (err) {
        console.error('Failed to fetch league:', err);
        setError('Failed to load league. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      fetchLeague();
    }
  }, [code]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading league...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
            <p className="text-gray-300 mb-4">{error}</p>
            <a
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
            >
              Go Home
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (!league) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-gray-400">League not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <JoinLeague league={league} />
    </main>
  );
}

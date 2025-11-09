'use client';

import { useState, useEffect } from 'react';
import { getLeague, updatePlayerReady } from '@/lib/league/operations';
import type { League } from '@/lib/types';

/**
 * Hook for managing league state
 */
export function useLeague(leagueId: string | null) {
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setLoading(false);
      return;
    }

    async function fetchLeague() {
      try {
        setLoading(true);
        const data = await getLeague(leagueId);
        setLeague(data);
        setError(null);
      } catch (err) {
        setError('Failed to load league');
        console.error('Error loading league:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeague();
  }, [leagueId]);

  const refresh = async () => {
    if (!leagueId) return;
    const data = await getLeague(leagueId);
    setLeague(data);
  };

  const toggleReady = async (playerId: string, isReady: boolean) => {
    await updatePlayerReady(playerId, isReady);
    await refresh();
  };

  return {
    league,
    loading,
    error,
    refresh,
    toggleReady
  };
}

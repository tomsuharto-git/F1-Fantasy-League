'use client';

import { useState, useEffect } from 'react';
import { 
  generateSnakeDraftOrder, 
  getCurrentPickInfo,
  getDraftPicks,
  getAvailableDrivers
} from '@/lib/draft/logic';
import { useDraftRealtime } from './useRealtime';
import type { Player, DraftPick, Driver } from '@/lib/types';

interface UseDraftOptions {
  raceId: string;
  players: Player[];
  allDrivers: Driver[];
  driversPerTeam: number;
}

/**
 * Hook for managing draft state
 */
export function useDraft({ raceId, players, allDrivers, driversPerTeam }: UseDraftOptions) {
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial picks
  useEffect(() => {
    async function loadPicks() {
      const data = await getDraftPicks(raceId);
      setPicks(data);
      setLoading(false);
    }
    loadPicks();
  }, [raceId]);

  // Real-time updates for new picks
  useDraftRealtime(raceId, (newPick) => {
    setPicks(prev => [...prev, newPick]);
  });

  // Calculate current state
  const currentPickInfo = getCurrentPickInfo(players, picks, driversPerTeam);
  const availableDrivers = getAvailableDrivers(allDrivers, picks);
  const draftOrder = generateSnakeDraftOrder(players, driversPerTeam);
  const isComplete = picks.length >= draftOrder.length;

  const refresh = async () => {
    const data = await getDraftPicks(raceId);
    setPicks(data);
  };

  return {
    picks,
    loading,
    currentPickInfo,
    availableDrivers,
    draftOrder,
    isComplete,
    refresh
  };
}

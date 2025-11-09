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
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes
  const [isPaused, setIsPaused] = useState(false);

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
    setTimeRemaining(120); // Reset timer
  });

  // Timer countdown
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Calculate current state
  const currentPickInfo = getCurrentPickInfo(players, picks, driversPerTeam);
  const availableDrivers = getAvailableDrivers(allDrivers, picks);
  const draftOrder = generateSnakeDraftOrder(players, driversPerTeam);
  const isComplete = picks.length >= draftOrder.length;

  const pauseDraft = () => setIsPaused(true);
  const resumeDraft = () => {
    setIsPaused(false);
    setTimeRemaining(120);
  };

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
    timeRemaining,
    isPaused,
    isComplete,
    pauseDraft,
    resumeDraft,
    refresh
  };
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Load initial picks and set up polling fallback
  useEffect(() => {
    async function loadPicks() {
      const data = await getDraftPicks(raceId);
      setPicks(data);
      setLoading(false);
    }
    loadPicks();

    // Poll every 3 seconds as fallback for realtime
    const pollInterval = setInterval(async () => {
      const data = await getDraftPicks(raceId);
      setPicks(prev => {
        // Only update if picks have changed
        if (data.length !== prev.length) {
          console.log('[Draft] Poll detected new picks:', data.length, 'vs', prev.length);
          return data;
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [raceId]);

  // Stable callback for realtime updates
  const handleNewPick = useCallback((newPick: DraftPick) => {
    console.log('[Draft] Realtime pick received:', newPick);
    setPicks(prev => {
      // Check if pick already exists (avoid duplicates from optimistic + realtime)
      if (prev.some(p => p.id === newPick.id ||
          (p.driver_code === newPick.driver_code && p.race_id === newPick.race_id))) {
        console.log('[Draft] Duplicate pick ignored');
        return prev;
      }
      console.log('[Draft] Adding new pick to state');
      return [...prev, newPick];
    });
  }, []);

  // Real-time updates for new picks
  useDraftRealtime(raceId, handleNewPick);

  // Calculate current state
  const currentPickInfo = getCurrentPickInfo(players, picks, driversPerTeam);
  const availableDrivers = getAvailableDrivers(allDrivers, picks);
  const draftOrder = generateSnakeDraftOrder(players, driversPerTeam);
  const isComplete = picks.length >= draftOrder.length;

  const refresh = useCallback(async () => {
    const data = await getDraftPicks(raceId);
    setPicks(data);
  }, [raceId]);

  // Optimistic update - add pick to local state immediately
  const addOptimisticPick = useCallback((driver: Driver, playerId: string, pickNumber: number) => {
    const optimisticPick: DraftPick = {
      id: `optimistic-${Date.now()}`,
      race_id: raceId,
      player_id: playerId,
      driver_code: driver.code,
      driver_name: driver.name,
      driver_number: driver.number,
      team: driver.team,
      start_position: driver.startPosition,
      pick_number: pickNumber,
      created_at: new Date().toISOString()
    };
    setPicks(prev => [...prev, optimisticPick]);
  }, [raceId]);

  return {
    picks,
    loading,
    currentPickInfo,
    availableDrivers,
    draftOrder,
    isComplete,
    refresh,
    addOptimisticPick
  };
}

'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook for Supabase real-time subscriptions
 */
export function useRealtime<T>(
  table: string,
  filter: { column: string; value: any },
  onInsert?: (payload: T) => void,
  onUpdate?: (payload: T) => void,
  onDelete?: (payload: { old: T }) => void
) {
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(`${table}-${filter.value}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table,
          filter: `${filter.column}=eq.${filter.value}`
        },
        (payload) => {
          if (onInsert) onInsert(payload.new as T);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table,
          filter: `${filter.column}=eq.${filter.value}`
        },
        (payload) => {
          if (onUpdate) onUpdate(payload.new as T);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: table,
          filter: `${filter.column}=eq.${filter.value}`
        },
        (payload) => {
          if (onDelete) onDelete({ old: payload.old as T });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter.column, filter.value, onInsert, onUpdate, onDelete]);
}

/**
 * Hook for draft picks real-time updates
 */
export function useDraftRealtime(
  raceId: string,
  onNewPick: (pick: any) => void
) {
  useRealtime(
    'draft_picks',
    { column: 'race_id', value: raceId },
    onNewPick
  );
}

/**
 * Hook for player ready status updates
 */
export function usePlayerReadyRealtime(
  leagueId: string,
  onPlayerUpdate: (player: any) => void
) {
  useRealtime(
    'players',
    { column: 'league_id', value: leagueId },
    undefined,
    onPlayerUpdate
  );
}

/**
 * Hook for race results updates
 */
export function useRaceResultsRealtime(
  raceId: string,
  onResultUpdate: (result: any) => void
) {
  useRealtime(
    'race_results',
    { column: 'race_id', value: raceId },
    onResultUpdate,
    onResultUpdate
  );
}

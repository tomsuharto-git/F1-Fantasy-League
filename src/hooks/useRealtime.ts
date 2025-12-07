'use client';

import { useEffect, useRef } from 'react';
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
  // Use refs to hold callbacks so they don't cause re-subscriptions
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);

  // Keep refs up to date
  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
  }, [onInsert, onUpdate, onDelete]);

  useEffect(() => {
    console.log(`[Realtime] Subscribing to ${table} where ${filter.column}=${filter.value}`);

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
          console.log(`[Realtime] INSERT received on ${table}:`, payload.new);
          if (onInsertRef.current) onInsertRef.current(payload.new as T);
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
          console.log(`[Realtime] UPDATE received on ${table}:`, payload.new);
          if (onUpdateRef.current) onUpdateRef.current(payload.new as T);
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
          console.log(`[Realtime] DELETE received on ${table}:`, payload.old);
          if (onDeleteRef.current) onDeleteRef.current({ old: payload.old as T });
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for ${table}:`, status);
      });

    return () => {
      console.log(`[Realtime] Unsubscribing from ${table}`);
      supabase.removeChannel(channel);
    };
  }, [table, filter.column, filter.value]);
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

/**
 * Hook for race status updates (for draft sync)
 * Listens for races in a league changing to 'drafting' status
 */
export function useRaceStatusRealtime(
  leagueId: string,
  onRaceUpdate: (race: any) => void
) {
  useRealtime(
    'races',
    { column: 'league_id', value: leagueId },
    onRaceUpdate, // INSERT
    onRaceUpdate  // UPDATE
  );
}

// Draft Logic & Snake Draft Algorithm
import { supabase } from '../supabase';
import type { Player, DraftPick, Driver } from '../types';

/**
 * Generate snake draft order
 * Example: 3 players, 6 picks each = [1,2,3,3,2,1,1,2,3,3,2,1,1,2,3,3,2,1]
 */
export function generateSnakeDraftOrder(
  players: Player[],
  driversPerTeam: number
): number[] {
  const order: number[] = [];
  const numPlayers = players.length;
  const totalRounds = driversPerTeam;

  // Sort players by draft position
  const sortedPlayers = [...players].sort((a, b) => 
    (a.draft_position || 0) - (b.draft_position || 0)
  );

  for (let round = 0; round < totalRounds; round++) {
    if (round % 2 === 0) {
      // Even rounds: normal order (1,2,3)
      sortedPlayers.forEach((player, idx) => {
        order.push(idx);
      });
    } else {
      // Odd rounds: reverse order (3,2,1)
      sortedPlayers.slice().reverse().forEach((player, idx) => {
        order.push(numPlayers - 1 - idx);
      });
    }
  }

  return order;
}

/**
 * Get current pick information
 */
export function getCurrentPickInfo(
  players: Player[],
  existingPicks: DraftPick[],
  driversPerTeam: number
) {
  const draftOrder = generateSnakeDraftOrder(players, driversPerTeam);
  const currentPickIndex = existingPicks.length;
  
  if (currentPickIndex >= draftOrder.length) {
    return null; // Draft complete
  }

  const sortedPlayers = [...players].sort((a, b) => 
    (a.draft_position || 0) - (b.draft_position || 0)
  );

  const playerIndex = draftOrder[currentPickIndex];
  const currentPlayer = sortedPlayers[playerIndex];

  return {
    pickNumber: currentPickIndex + 1,
    playerIndex,
    player: currentPlayer,
    totalPicks: draftOrder.length
  };
}

/**
 * Make a draft pick
 */
export async function makeDraftPick(
  raceId: string,
  playerId: string,
  driver: Driver,
  pickNumber: number
): Promise<DraftPick> {
  // Validate driver not already picked
  const { data: existingPick } = await supabase
    .from('draft_picks')
    .select('id')
    .eq('race_id', raceId)
    .eq('driver_code', driver.code)
    .single();

  if (existingPick) {
    throw new Error('Driver already picked');
  }

  // Insert pick
  const { data: pick, error } = await supabase
    .from('draft_picks')
    .insert({
      race_id: raceId,
      player_id: playerId,
      driver_code: driver.code,
      driver_name: driver.name,
      driver_number: driver.number,
      team: driver.team,
      start_position: driver.startPosition,
      pick_number: pickNumber
    })
    .select()
    .single();

  if (error || !pick) {
    throw new Error('Failed to make pick');
  }

  return pick;
}

/**
 * Undo last draft pick
 */
export async function undoLastPick(raceId: string): Promise<DraftPick | null> {
  // Get last pick
  const { data: picks, error: fetchError } = await supabase
    .from('draft_picks')
    .select('*')
    .eq('race_id', raceId)
    .order('pick_number', { ascending: false })
    .limit(1);

  if (fetchError || !picks || picks.length === 0) {
    return null;
  }

  const lastPick = picks[0];

  // Delete it
  const { error: deleteError } = await supabase
    .from('draft_picks')
    .delete()
    .eq('id', lastPick.id);

  if (deleteError) {
    throw new Error('Failed to undo pick');
  }

  return lastPick;
}

/**
 * Get all draft picks for a race
 */
export async function getDraftPicks(raceId: string): Promise<DraftPick[]> {
  const { data, error } = await supabase
    .from('draft_picks')
    .select('*')
    .eq('race_id', raceId)
    .order('pick_number', { ascending: true });

  if (error) return [];
  return data || [];
}

/**
 * Get picks for a specific player
 */
export async function getPlayerPicks(
  raceId: string,
  playerId: string
): Promise<DraftPick[]> {
  const { data, error } = await supabase
    .from('draft_picks')
    .select('*')
    .eq('race_id', raceId)
    .eq('player_id', playerId)
    .order('pick_number', { ascending: true });

  if (error) return [];
  return data || [];
}

/**
 * Check if driver is available
 */
export async function isDriverAvailable(
  raceId: string,
  driverCode: string
): Promise<boolean> {
  const { data } = await supabase
    .from('draft_picks')
    .select('id')
    .eq('race_id', raceId)
    .eq('driver_code', driverCode)
    .single();

  return !data;
}

/**
 * Get available drivers (not yet picked)
 */
export function getAvailableDrivers(
  allDrivers: Driver[],
  pickedDrivers: DraftPick[]
): Driver[] {
  const pickedCodes = new Set(pickedDrivers.map(p => p.driver_code));
  return allDrivers.filter(driver => !pickedCodes.has(driver.code));
}

/**
 * Mark draft as complete
 */
export async function completeDraft(raceId: string): Promise<void> {
  const { error } = await supabase
    .from('races')
    .update({ 
      draft_complete: true,
      status: 'live'
    })
    .eq('id', raceId);

  if (error) throw error;
}

/**
 * Calculate draft progress percentage
 */
export function getDraftProgress(
  currentPicks: number,
  totalPicks: number
): number {
  return Math.round((currentPicks / totalPicks) * 100);
}

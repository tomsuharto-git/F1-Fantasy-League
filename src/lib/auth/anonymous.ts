// Anonymous Player Authentication
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';
import type { LocalPlayer } from '../types';

/**
 * Create an anonymous player (no auth required)
 */
export async function createAnonymousPlayer(
  leagueId: string,
  displayName: string,
  color: string
): Promise<string> {
  const playerId = uuidv4();
  
  // Insert into Supabase
  const { error } = await supabase
    .from('players')
    .insert({
      id: playerId,
      league_id: leagueId,
      display_name: displayName,
      color: color,
      user_id: null,
      is_verified: false
    });
  
  if (error) {
    console.error('Failed to create anonymous player:', error);
    throw error;
  }
  
  // Store in localStorage
  localStorage.setItem('player_id', playerId);
  localStorage.setItem(`league_${leagueId}_player`, JSON.stringify({
    id: playerId,
    displayName,
    color,
    leagueId
  } as LocalPlayer));
  
  return playerId;
}

/**
 * Get local player data for a league
 */
export function getLocalPlayer(leagueId: string): LocalPlayer | null {
  const stored = localStorage.getItem(`league_${leagueId}_player`);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Get current player ID (anonymous or verified)
 */
export function getCurrentPlayerId(): string | null {
  // First check for verified user
  const userId = localStorage.getItem('user_id');
  if (userId) return userId;
  
  // Fall back to anonymous player ID
  return localStorage.getItem('player_id');
}

/**
 * Check if user is verified
 */
export function isVerified(): boolean {
  return !!localStorage.getItem('user_id');
}

/**
 * Clear anonymous player data
 */
export function clearAnonymousPlayer(leagueId?: string): void {
  if (leagueId) {
    localStorage.removeItem(`league_${leagueId}_player`);
  }
  localStorage.removeItem('player_id');
}

// League Management Functions
import { supabase } from '../supabase';
import type { League, CreateLeagueInput, Player } from '../types';

/**
 * Create a new league
 */
export async function createLeague(input: CreateLeagueInput): Promise<League> {
  // Insert league
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({
      name: input.name,
      type: input.type,
      max_races: input.max_races,
      drivers_per_team: input.drivers_per_team,
      status: 'setup'
    })
    .select()
    .single();

  if (leagueError || !league) {
    throw new Error('Failed to create league');
  }

  // Create players for each team
  const players = await createPlayers(league.id, input.teams, input.draft_order);

  return {
    ...league,
    players
  };
}

/**
 * Create players for a league
 */
async function createPlayers(
  leagueId: string,
  teams: Array<{ name: string; color: string }>,
  draftOrder: 'random' | 'manual'
): Promise<Player[]> {
  // Determine draft positions
  const positions = draftOrder === 'random' 
    ? shuffleArray([...Array(teams.length)].map((_, i) => i + 1))
    : teams.map((_, i) => i + 1);

  const playersToInsert = teams.map((team, index) => ({
    league_id: leagueId,
    display_name: team.name,
    color: team.color,
    draft_position: positions[index],
    user_id: null,
    is_verified: false,
    is_ready: false
  }));

  const { data: players, error } = await supabase
    .from('players')
    .insert(playersToInsert)
    .select();

  if (error || !players) {
    throw new Error('Failed to create players');
  }

  return players;
}

/**
 * Get league by ID
 */
export async function getLeague(leagueId: string): Promise<League | null> {
  const { data, error } = await supabase
    .from('leagues')
    .select(`
      *,
      players(*),
      races(*)
    `)
    .eq('id', leagueId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Get league by share code
 */
export async function getLeagueByShareCode(shareCode: string): Promise<League | null> {
  const { data, error } = await supabase
    .from('leagues')
    .select(`
      *,
      players(*)
    `)
    .eq('share_code', shareCode)
    .single();

  if (error) return null;
  return data;
}

/**
 * Update league status
 */
export async function updateLeagueStatus(
  leagueId: string,
  status: 'setup' | 'active' | 'complete'
): Promise<void> {
  const { error } = await supabase
    .from('leagues')
    .update({ status })
    .eq('id', leagueId);

  if (error) throw error;
}

/**
 * Get all leagues for a user
 */
export async function getUserLeagues(userId: string): Promise<League[]> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      league:leagues(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data?.map((p: any) => p.league).filter(Boolean) || [];
}

/**
 * Update player ready status
 */
export async function updatePlayerReady(
  playerId: string,
  isReady: boolean
): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ is_ready: isReady })
    .eq('id', playerId);

  if (error) throw error;
}

/**
 * Check if all players are ready
 */
export async function areAllPlayersReady(leagueId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('players')
    .select('is_ready')
    .eq('league_id', leagueId);

  if (error || !data) return false;
  return data.every(player => player.is_ready);
}

/**
 * Helper: Shuffle array (for random draft order)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

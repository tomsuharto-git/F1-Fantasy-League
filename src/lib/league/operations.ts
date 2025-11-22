// League Management Functions
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/auth/client';
import type { League, CreateLeagueInput, Player } from '../types';

/**
 * Create a new league
 */
export async function createLeague(input: CreateLeagueInput): Promise<League> {
  const supabase = createClient();

  // Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Must be authenticated to create a league');
  }

  // Insert league
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({
      name: input.name,
      type: input.type,
      max_races: input.max_races,
      drivers_per_team: input.drivers_per_team,
      status: 'setup',
      created_by: user.id
    })
    .select()
    .single();

  if (leagueError || !league) {
    throw new Error('Failed to create league');
  }

  // Create creator's player
  const creatorPlayer = await createCreatorPlayer(league.id, input.creator_team, user.id);

  return {
    ...league,
    players: [creatorPlayer]
  };
}

/**
 * Create the creator's player for a new league
 * Draft positions will be assigned later when the draft starts
 */
async function createCreatorPlayer(
  leagueId: string,
  team: { name: string; color: string },
  creatorUserId: string
): Promise<Player> {
  const supabase = createClient();
  const { data: player, error } = await supabase
    .from('players')
    .insert({
      league_id: leagueId,
      display_name: team.name,
      color: team.color,
      draft_position: null, // Will be assigned when draft starts
      user_id: creatorUserId,
      is_verified: true,
      is_ready: false
    })
    .select()
    .single();

  if (error || !player) {
    throw new Error('Failed to create creator player');
  }

  return player;
}

/**
 * Get league by ID
 */
export async function getLeague(leagueId: string): Promise<League | null> {
  const supabase = createClient();
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leagues')
    .select(`
      *,
      players(*)
    `)
    .eq('share_code', shareCode)
    .single();

  if (error) {
    console.error('Error fetching league by share code:', {
      shareCode,
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }

  return data;
}

/**
 * Update league status
 */
export async function updateLeagueStatus(
  leagueId: string,
  status: 'setup' | 'active' | 'complete'
): Promise<void> {
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
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

/**
 * Start draft - assign draft positions and create race
 */
export async function startDraft(
  leagueId: string,
  draftOrder: 'random' | 'manual',
  manualOrder?: string[] // Array of player IDs in desired order
): Promise<string> {
  const supabase = createClient();

  // Get league with players
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('*, players(*)')
    .eq('id', leagueId)
    .single();

  if (leagueError || !league) {
    throw new Error('League not found');
  }

  // Determine draft order
  let orderedPlayerIds: string[];

  if (draftOrder === 'random') {
    // Random shuffle
    orderedPlayerIds = shuffleArray(league.players.map((p: Player) => p.id));
  } else {
    // Use manual order
    if (!manualOrder || manualOrder.length !== league.players.length) {
      throw new Error('Invalid manual order');
    }
    orderedPlayerIds = manualOrder;
  }

  // Assign draft positions to players
  const updates = orderedPlayerIds.map((playerId, index) => ({
    id: playerId,
    draft_position: index + 1
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('players')
      .update({ draft_position: update.draft_position })
      .eq('id', update.id);

    if (error) {
      throw new Error('Failed to assign draft positions');
    }
  }

  // Create race for this draft
  const { data: race, error: raceError } = await supabase
    .from('races')
    .insert({
      league_id: leagueId,
      race_number: 1,
      race_name: 'Draft Race',
      status: 'drafting',
      draft_complete: false,
      results_finalized: false
    })
    .select()
    .single();

  if (raceError || !race) {
    throw new Error('Failed to create race');
  }

  // Update league status to active
  await updateLeagueStatus(leagueId, 'active');

  return race.id;
}

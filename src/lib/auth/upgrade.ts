// Account Upgrade (Anonymous → Verified)
import { supabase } from '../supabase';

/**
 * Upgrade anonymous player to verified account
 */
export async function upgradeToVerifiedAccount(
  playerId: string,
  email: string
): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        player_id: playerId,
        upgrade: true
      }
    }
  });
  
  if (error) {
    console.error('Failed to upgrade account:', error);
    throw error;
  }
}

/**
 * Handle auth callback after magic link click
 */
export async function handleAuthCallback(): Promise<void> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new Error('Authentication failed');
  }
  
  const userId = session.user.id;
  const playerId = session.user.user_metadata.player_id;
  
  if (playerId) {
    // This is an upgrade - link player to user
    await linkPlayerToUser(playerId, userId);
  }
  
  // Store user ID
  localStorage.setItem('user_id', userId);
  localStorage.removeItem('player_id'); // No longer anonymous
}

/**
 * Link anonymous player to verified user
 */
async function linkPlayerToUser(
  playerId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({
      user_id: userId,
      is_verified: true
    })
    .eq('id', playerId);
  
  if (error) {
    console.error('Failed to link player to user:', error);
    throw error;
  }
}

/**
 * Get all leagues for a verified user
 */
export async function getUserLeagues(userId: string) {
  const { data, error } = await supabase
    .from('players')
    .select(`
      id,
      league:leagues(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to get user leagues:', error);
    return [];
  }
  
  return data?.map((p: any) => p.league) || [];
}

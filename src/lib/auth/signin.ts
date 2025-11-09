// Sign In/Out for Verified Users
import { supabase } from '../supabase';

/**
 * Sign in with email (magic link)
 */
export async function signInWithEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  
  // Clear local storage
  localStorage.removeItem('user_id');
  localStorage.removeItem('player_id');
  
  // Redirect to home
  window.location.href = '/';
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('user_id');
    }
    
    if (event === 'SIGNED_IN' && session) {
      localStorage.setItem('user_id', session.user.id);
    }
    
    callback(event, session);
  });
}

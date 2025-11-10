'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/client';
import type { User } from '@supabase/supabase-js';
import { showNotification } from '@/components/shared/NotificationSystem';

interface UserLeague {
  league_id: string;
  league_name: string;
  league_type: string;
  player_id: string | null;
  player_name: string | null;
  player_color: string | null;
  role: 'creator' | 'member';
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [leagues, setLeagues] = useState<UserLeague[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/signin');
          return;
        }

        setUser(user);

        // Get user's leagues
        const { data, error } = await supabase.rpc('get_user_leagues');

        if (error) throw error;

        setLeagues(data || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Failed to load dashboard', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to signin
  }

  // Get display name from metadata or email
  const displayName = user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     user.email?.split('@')[0] ||
                     'User';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {displayName}! 👋
            </h1>
            <p className="text-gray-400">{user.email}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push('/create')}
            className="p-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl mb-2">➕</div>
            <h3 className="text-xl font-bold mb-1">Create New League</h3>
            <p className="text-blue-200 text-sm">
              Start a new fantasy league with friends
            </p>
          </button>

          <button
            onClick={() => {
              const code = prompt('Enter league code:');
              if (code) {
                router.push(`/join/${code.toUpperCase()}`);
              }
            }}
            className="p-6 bg-green-600 hover:bg-green-700 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl mb-2">🤝</div>
            <h3 className="text-xl font-bold mb-1">Join League</h3>
            <p className="text-green-200 text-sm">
              Join an existing league with a share code
            </p>
          </button>
        </div>

        {/* User's Leagues */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">
            Your Leagues ({leagues.length})
          </h2>

          {leagues.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <img
                  src="/grid-kings-logo.png"
                  alt="Grid Kings Logo"
                  className="h-32 w-auto opacity-50"
                />
              </div>
              <p className="text-gray-400 mb-4">
                You haven't joined any leagues yet
              </p>
              <p className="text-sm text-gray-500">
                Create a league or join one with a share code to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leagues.map((league) => (
                <div
                  key={league.league_id}
                  onClick={() => {
                    // Navigate to waiting room if user is a member
                    // Otherwise navigate to league standings
                    if (league.player_id) {
                      router.push(`/league/${league.league_id}/waiting-room`);
                    } else {
                      router.push(`/league/${league.league_id}/standings`);
                    }
                  }}
                  className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Color indicator (if player has one) */}
                    {league.player_color && (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: league.player_color }}
                      >
                        {league.player_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-lg">{league.league_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {league.player_name && (
                          <span>Team: {league.player_name}</span>
                        )}
                        <span>•</span>
                        <span className="capitalize">{league.league_type.replace('_', ' ')}</span>
                        {league.role === 'creator' && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">Creator</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-400">→</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats (Future enhancement) */}
        {leagues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{leagues.length}</div>
              <div className="text-sm text-gray-400">Total Leagues</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {leagues.filter(l => l.role === 'creator').length}
              </div>
              <div className="text-sm text-gray-400">Created by You</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-400">
                {leagues.filter(l => l.role === 'member').length}
              </div>
              <div className="text-sm text-gray-400">Joined</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

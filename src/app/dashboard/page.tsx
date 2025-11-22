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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2B83E] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
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
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent">
              Welcome, {displayName}! 👋
            </h1>
            <p className="text-gray-400">{user.email}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded-lg transition-all font-medium border border-gray-700"
          >
            Sign Out
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => router.push('/create')}
            className="group p-8 bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] rounded-lg text-left transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="text-4xl mb-3">➕</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Create New League</h3>
            <p className="text-white/90 text-sm">
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
            className="group p-8 bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] rounded-lg text-left transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Join League</h3>
            <p className="text-white/90 text-sm">
              Join an existing league with a share code
            </p>
          </button>
        </div>

        {/* User's Leagues */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">
            Your Leagues ({leagues.length})
          </h2>

          {leagues.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-6">
                <img
                  src="/grid-kings-logo-transparent.png"
                  alt="Grid Kings Logo"
                  className="h-32 w-auto opacity-30"
                />
              </div>
              <p className="text-gray-300 text-lg mb-2">
                You haven't joined any leagues yet
              </p>
              <p className="text-sm text-gray-500">
                Create a league or join one with a share code to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
                  className="group flex items-center justify-between p-6 bg-[#252525] hover:bg-[#2a2a2a] rounded-lg cursor-pointer transition-all border border-gray-800 hover:border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    {/* Color indicator (if player has one) */}
                    {league.player_color && (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                        style={{ backgroundColor: league.player_color }}
                      >
                        {league.player_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-xl mb-1 group-hover:text-[#D2B83E] transition-colors">
                        {league.league_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {league.player_name && (
                          <span>Team: {league.player_name}</span>
                        )}
                        <span>•</span>
                        <span className="capitalize">{league.league_type.replace('_', ' ')}</span>
                        {league.role === 'creator' && (
                          <>
                            <span>•</span>
                            <span className="text-[#D2B83E]">Creator</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-500 group-hover:text-[#D2B83E] transition-colors">→</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {leagues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#252525] rounded-lg border border-gray-800">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent mb-2">
                {leagues.length}
              </div>
              <div className="text-sm text-gray-400">Total Leagues</div>
            </div>

            <div className="p-6 bg-[#252525] rounded-lg border border-gray-800">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent mb-2">
                {leagues.filter(l => l.role === 'creator').length}
              </div>
              <div className="text-sm text-gray-400">Created by You</div>
            </div>

            <div className="p-6 bg-[#252525] rounded-lg border border-gray-800">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent mb-2">
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

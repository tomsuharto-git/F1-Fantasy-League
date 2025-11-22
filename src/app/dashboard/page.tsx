'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/client';
import type { User } from '@supabase/supabase-js';
import { showNotification } from '@/components/shared/NotificationSystem';
import { JoinLeagueModal } from '@/components/dashboard/JoinLeagueModal';
import { Plus, UserPlus } from 'lucide-react';

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
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/signin');
          return;
        }

        setUser(user);

        const { data, error } = await supabase.rpc('get_user_leagues');

        if (error) {
          console.error('RPC Error:', error);
          throw error;
        }

        setLeagues(data || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        showNotification(`Failed to load dashboard: ${errorMessage}`, 'error');
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
    return null;
  }

  const hasLeagues = leagues.length > 0;
  const displayName = user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     user.email?.split('@')[0] ||
                     'User';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#1e1e1e]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <img
                src="/grid-kings-logo-transparent.png"
                alt="Grid Kings"
                className="h-10 w-auto"
              />
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">
                {displayName}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333333] text-white text-xs rounded-md transition-all border border-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats - Show at top when user has leagues */}
        {hasLeagues && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-[#252525] rounded-lg border border-gray-800">
              <div className="text-3xl font-bold bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent mb-1">
                {leagues.length}
              </div>
              <div className="text-xs text-gray-400">Total Leagues</div>
            </div>

            <div className="p-4 bg-[#252525] rounded-lg border border-gray-800">
              <div className="text-3xl font-bold bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent mb-1">
                {leagues.filter(l => l.role === 'creator').length}
              </div>
              <div className="text-xs text-gray-400">Created by You</div>
            </div>

            <div className="p-4 bg-[#252525] rounded-lg border border-gray-800">
              <div className="text-3xl font-bold bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent mb-1">
                {leagues.filter(l => l.role === 'member').length}
              </div>
              <div className="text-xs text-gray-400">Joined</div>
            </div>
          </div>
        )}

        {/* Leagues List - Show first when user has leagues */}
        {hasLeagues && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Your Leagues</h2>
            <div className="space-y-3">
              {leagues.map((league) => (
                <div
                  key={league.league_id}
                  onClick={() => {
                    if (league.player_id) {
                      router.push(`/league/${league.league_id}/waiting-room`);
                    } else {
                      router.push(`/league/${league.league_id}/standings`);
                    }
                  }}
                  className="group flex items-center justify-between p-5 bg-[#252525] hover:bg-[#2a2a2a] rounded-lg cursor-pointer transition-all border border-gray-800 hover:border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    {league.player_color && (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ backgroundColor: league.player_color }}
                      >
                        {league.player_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-lg mb-0.5 group-hover:text-[#D2B83E] transition-colors">
                        {league.league_name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
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
          </div>
        )}

        {/* Quick Actions */}
        {hasLeagues ? (
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/create')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D2B83E] to-[#C3693B] hover:from-[#E5C94F] hover:to-[#D47A4C] text-white rounded-lg transition-all font-medium shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create League
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C3693B] to-[#B42518] hover:from-[#D47A4C] hover:to-[#C53829] text-white rounded-lg transition-all font-medium shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              Join League
            </button>
          </div>
        ) : (
          // Large action buttons for empty state - no empty message
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => router.push('/create')}
              className="group p-8 bg-gradient-to-r from-[#D2B83E] to-[#C3693B] hover:from-[#E5C94F] hover:to-[#D47A4C] rounded-lg text-left transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-12 h-12 mb-3 text-[#1a1a1a]" />
              <h3 className="text-2xl font-bold mb-2 text-white">Create New League</h3>
              <p className="text-white/90 text-sm">
                Start a new fantasy league with friends
              </p>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="group p-8 bg-gradient-to-r from-[#C3693B] to-[#B42518] hover:from-[#D47A4C] hover:to-[#C53829] rounded-lg text-left transition-all transform hover:scale-105 shadow-lg"
            >
              <UserPlus className="w-12 h-12 mb-3 text-[#1a1a1a]" />
              <h3 className="text-2xl font-bold mb-2 text-white">Join League</h3>
              <p className="text-white/90 text-sm">
                Join an existing league with a share code
              </p>
            </button>
          </div>
        )}
      </main>

      {/* Join League Modal */}
      <JoinLeagueModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
}

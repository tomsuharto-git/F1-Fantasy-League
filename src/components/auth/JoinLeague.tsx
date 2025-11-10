'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/client';
import { showNotification } from '@/components/shared/NotificationSystem';
import type { League, Player } from '@/lib/types';

interface JoinLeagueProps {
  league: League;
}

export function JoinLeague({ league }: JoinLeagueProps) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Check if user is authenticated and if they've already joined this league
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showNotification('You must be logged in to join a league', 'error');
        router.push('/signin');
        return;
      }

      setCurrentUserId(user.id);

      // Check if user already has a player in this league
      const existingPlayer = league.players?.find(p => p.user_id === user.id);
      if (existingPlayer) {
        showNotification('You have already joined this league', 'info');
        router.push(`/league/${league.id}/waiting-room`);
      }
    }

    checkAuth();
  }, [league, router, supabase]);

  const handleJoin = async () => {
    if (!selectedTeamId || !currentUserId) return;

    try {
      setLoading(true);

      // Update the player record to assign it to the current user
      const { error } = await supabase
        .from('players')
        .update({
          user_id: currentUserId,
          is_verified: true
        })
        .eq('id', selectedTeamId)
        .is('user_id', null); // Only update if not already claimed

      if (error) throw error;

      showNotification('Successfully joined league!', 'success');
      router.push(`/league/${league.id}/waiting-room`);
    } catch (error) {
      console.error('Failed to join league:', error);
      showNotification('Failed to join league. This team may have been claimed by someone else.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get unclaimed teams (players without user_id)
  const availableTeams = league.players?.filter(player => !player.user_id) || [];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">{league.name}</h1>
        <p className="text-gray-400 mb-6">
          Select your team to join the league
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">Choose Your Team</label>
            <div className="space-y-2">
              {availableTeams.length === 0 ? (
                <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded">
                  <p className="text-yellow-400">
                    All teams are taken. Ask the league creator to add more teams.
                  </p>
                </div>
              ) : (
                availableTeams.map((player) => (
                  <label
                    key={player.id}
                    className={`
                      flex items-center p-4 rounded cursor-pointer border-2 transition-all
                      ${selectedTeamId === player.id
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={player.id}
                      checked={selectedTeamId === player.id}
                      onChange={() => setSelectedTeamId(player.id)}
                      className="mr-3"
                    />
                    <div
                      className="w-6 h-6 rounded-full mr-3"
                      style={{ backgroundColor: player.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{player.display_name}</div>
                      {player.draft_position && (
                        <div className="text-sm text-gray-400">
                          Draft position: {player.draft_position}
                        </div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleJoin}
            disabled={!selectedTeamId || loading || availableTeams.length === 0}
            className={`
              w-full py-3 rounded font-bold transition-colors
              ${!selectedTeamId || loading || availableTeams.length === 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {loading ? 'Joining...' : 'Join League'}
          </button>
        </div>
      </div>
    </div>
  );
}

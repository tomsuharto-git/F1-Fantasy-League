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
  const [loading, setLoading] = useState(true);
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Player[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuthAndTeams() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/signin');
          return;
        }

        setCurrentUser(user);

        // Check if user already has a player in this league
        const existingPlayer = league.players?.find(p => p.user_id === user.id);
        if (existingPlayer) {
          showNotification('You already joined this league', 'info');
          router.push(`/league/${league.id}/waiting-room`);
          return;
        }

        // Get unclaimed teams (players with null user_id)
        const unclaimed = league.players?.filter(p => !p.user_id) || [];
        setAvailableTeams(unclaimed);
      } catch (error) {
        console.error('Failed to load teams:', error);
        showNotification('Failed to load teams', 'error');
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndTeams();
  }, [league.id, league.players, router, supabase]);

  const handleJoin = async () => {
    if (!selectedTeamId || !currentUser) return;

    try {
      setJoiningLoading(true);

      // Update the selected player with current user's ID
      const { error } = await supabase
        .from('players')
        .update({
          user_id: currentUser.id,
          is_verified: true
        })
        .eq('id', selectedTeamId)
        .eq('league_id', league.id)
        .is('user_id', null); // Only update if not already claimed

      if (error) throw error;

      showNotification('Successfully joined league!', 'success');
      router.push(`/league/${league.id}/waiting-room`);
    } catch (error) {
      console.error('Failed to join league:', error);
      showNotification('Failed to join league. Please try again.', 'error');
    } finally {
      setJoiningLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
            disabled={!selectedTeamId || joiningLoading || availableTeams.length === 0}
            className={`
              w-full py-3 rounded font-bold transition-colors
              ${!selectedTeamId || joiningLoading || availableTeams.length === 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {joiningLoading ? 'Joining...' : 'Join League'}
          </button>
        </div>
      </div>
    </div>
  );
}

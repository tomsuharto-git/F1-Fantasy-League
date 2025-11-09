'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { League, Player } from '@/lib/types';

interface JoinLeagueProps {
  league: League;
}

export function JoinLeague({ league }: JoinLeagueProps) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user already claimed a team
  useEffect(() => {
    const storedPlayerId = localStorage.getItem(`league_${league.id}_player`);
    if (storedPlayerId) {
      router.push(`/league/${league.id}/waiting-room`);
    }
  }, [league.id, router]);

  const handleJoin = async () => {
    if (!selectedTeamId) return;

    try {
      setLoading(true);

      // Store the selected team (player) ID in localStorage
      localStorage.setItem(`league_${league.id}_player`, selectedTeamId);

      router.push(`/league/${league.id}/waiting-room`);
    } catch (error) {
      console.error('Failed to join league:', error);
      alert('Failed to join league. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get unclaimed teams (players)
  const availableTeams = league.players?.filter(player => {
    // Check if team is already claimed (has localStorage entry)
    const claimed = localStorage.getItem(`league_${league.id}_player`) === player.id;
    return !claimed;
  }) || [];

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

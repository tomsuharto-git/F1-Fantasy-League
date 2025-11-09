'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { League, SeasonStanding } from '@/lib/types';

interface StandingsPageProps {
  params: {
    id: string;
  };
}

export default function StandingsPage({ params }: StandingsPageProps) {
  const router = useRouter();
  const leagueId = params.id;

  const [league, setLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<SeasonStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStandings() {
      try {
        setLoading(true);

        // Fetch league
        const { data: leagueData, error: leagueError } = await supabase
          .from('leagues')
          .select(`
            *,
            players(*)
          `)
          .eq('id', leagueId)
          .single();

        if (leagueError || !leagueData) {
          setError('League not found');
          return;
        }

        setLeague(leagueData);

        // Fetch season standings view
        const { data: standingsData, error: standingsError } = await supabase
          .from('season_standings')
          .select('*')
          .eq('league_id', leagueId)
          .order('total_points', { ascending: false });

        if (standingsError) {
          // If view doesn't exist, calculate from race results
          const { data: resultsData } = await supabase
            .from('race_results')
            .select(`
              *,
              race:races!inner(
                id,
                race_name,
                race_number,
                league_id
              )
            `)
            .eq('race.league_id', leagueId);

          if (resultsData) {
            // Group by player
            const playerMap = new Map<string, {
              player_id: string;
              player_name: string;
              color: string;
              total_points: number;
              races_completed: number;
              race_breakdown: any[];
            }>();

            resultsData.forEach((result: any) => {
              const player = leagueData.players?.find((p: any) => p.id === result.player_id);
              if (!player) return;

              if (!playerMap.has(result.player_id)) {
                playerMap.set(result.player_id, {
                  player_id: result.player_id,
                  player_name: player.display_name,
                  color: player.color,
                  total_points: 0,
                  races_completed: 0,
                  race_breakdown: []
                });
              }

              const playerData = playerMap.get(result.player_id)!;
              playerData.total_points += result.total_points;
              playerData.races_completed += 1;
              playerData.race_breakdown.push({
                race_id: result.race.id,
                race_name: result.race.race_name,
                race_number: result.race.race_number,
                points: result.total_points
              });
            });

            const calculatedStandings = Array.from(playerMap.values())
              .sort((a, b) => b.total_points - a.total_points);

            setStandings(calculatedStandings as SeasonStanding[]);
          }
        } else if (standingsData) {
          setStandings(standingsData);
        }
      } catch (err) {
        console.error('Failed to load standings:', err);
        setError('Failed to load standings');
      } finally {
        setLoading(false);
      }
    }

    loadStandings();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading standings...</p>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error || 'Failed to load standings'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{league.name}</h1>
          <p className="text-gray-400">Season Standings</p>
        </div>

        {/* No Races Yet */}
        {standings.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-xl text-gray-400 mb-4">No races completed yet</p>
            <p className="text-gray-500">
              Complete a race to see standings here
            </p>
          </div>
        )}

        {/* Standings Table */}
        {standings.length > 0 && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left">Position</th>
                    <th className="px-6 py-4 text-left">Player</th>
                    <th className="px-6 py-4 text-center">Races</th>
                    {/* Race columns */}
                    {standings[0]?.race_breakdown?.map((race, idx) => (
                      <th key={race.race_id} className="px-4 py-4 text-center">
                        <div className="text-xs text-gray-400">R{race.race_number}</div>
                        <div className="text-xs truncate max-w-[100px]">{race.race_name}</div>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing, index) => (
                    <tr
                      key={standing.player_id}
                      className={`border-t border-gray-700 ${
                        index === 0 ? 'bg-yellow-900/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                          {index === 0 && <span className="text-2xl">🏆</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: standing.color }}
                          />
                          <span className="font-bold">{standing.player_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {standing.races_completed}
                      </td>
                      {/* Race scores */}
                      {standing.race_breakdown?.map(race => (
                        <td key={race.race_id} className="px-4 py-4 text-center font-medium">
                          {race.points}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <span className="text-2xl font-bold">{standing.total_points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Race History Cards */}
        {standings.length > 0 && standings[0]?.race_breakdown && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Race History</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {standings[0].race_breakdown.map(race => {
                // Get winner for this race
                const raceWinner = standings.reduce((winner, standing) => {
                  const raceScore = standing.race_breakdown?.find(r => r.race_id === race.race_id);
                  const winnerScore = winner.race_breakdown?.find(r => r.race_id === race.race_id);

                  if (!winnerScore || (raceScore && raceScore.points > winnerScore.points)) {
                    return standing;
                  }
                  return winner;
                }, standings[0]);

                return (
                  <div key={race.race_id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold">Race {race.race_number}</h3>
                      <span className="text-xs text-gray-400">{race.race_name}</span>
                    </div>

                    <div className="space-y-2">
                      {standings.map((standing, idx) => {
                        const raceScore = standing.race_breakdown?.find(r => r.race_id === race.race_id);

                        return (
                          <div key={standing.player_id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-6">#{idx + 1}</span>
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: standing.color }}
                              />
                              <span className={idx === 0 ? 'font-bold' : ''}>
                                {standing.player_name}
                              </span>
                            </div>
                            <span className={`font-medium ${idx === 0 ? 'text-yellow-400' : ''}`}>
                              {raceScore?.points || 0} pts
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {raceWinner && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <span>🏆</span>
                          <span className="font-bold">{raceWinner.player_name} won</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push(`/league/${leagueId}/waiting-room`)}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold"
          >
            ← Back to League
          </button>
        </div>
      </div>
    </div>
  );
}

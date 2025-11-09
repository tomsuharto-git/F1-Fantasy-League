'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { openF1 } from '@/lib/api/openf1';
import { useAPIStatus } from '@/hooks/useAPIStatus';
import { calculateDriverScore, calculateTeamTotal } from '@/lib/scoring';
import { DRIVER_NUMBERS, CODE_TO_NUMBER } from '@/lib/types';
import { showNotification } from '@/components/shared/NotificationSystem';
import type { Race, League, DraftPick, DriverPosition, DataSource } from '@/lib/types';

export default function RacePage() {
  const params = useParams();
  const router = useRouter();
  const raceId = params.raceId as string;

  const [race, setRace] = useState<Race | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [positions, setPositions] = useState<Map<string, DriverPosition>>(new Map());
  const [fastestLapDriver, setFastestLapDriver] = useState<string | null>(null);
  const [currentLap, setCurrentLap] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const apiStatus = useAPIStatus();

  // Load race data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch race
        const { data: raceData } = await supabase
          .from('races')
          .select('*')
          .eq('id', raceId)
          .single();

        if (!raceData) {
          showNotification('Race not found', 'error');
          return;
        }

        setRace(raceData);

        // Fetch league
        const { data: leagueData } = await supabase
          .from('leagues')
          .select(`
            *,
            players(*)
          `)
          .eq('id', raceData.league_id)
          .single();

        if (!leagueData) {
          showNotification('League not found', 'error');
          return;
        }

        setLeague(leagueData);

        // Fetch draft picks
        const { data: picksData } = await supabase
          .from('draft_picks')
          .select('*')
          .eq('race_id', raceId);

        if (picksData) {
          setPicks(picksData);

          // Initialize positions with starting positions
          const initialPositions = new Map();
          picksData.forEach(pick => {
            initialPositions.set(pick.driver_code, {
              driverId: pick.driver_code,
              driverNumber: pick.driver_number || 0,
              position: pick.start_position || 0,
              source: 'manual' as DataSource,
              lastUpdated: new Date()
            });
          });
          setPositions(initialPositions);
        }
      } catch (error) {
        console.error('Failed to load race data:', error);
        showNotification('Failed to load race data', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [raceId]);

  // OpenF1 auto-update
  useEffect(() => {
    if (!isLive || !race?.session_key) return;

    openF1.startAutoUpdate(
      race.session_key,
      (positionsMap, fastestLapNum, lap) => {
        // Update positions from API
        const updates = new Map(positions);

        positionsMap.forEach((position, driverNumber) => {
          const driverCode = DRIVER_NUMBERS[driverNumber];
          if (driverCode) {
            updates.set(driverCode, {
              driverId: driverCode,
              driverNumber,
              position,
              source: 'api',
              lastUpdated: new Date(),
              previousSource: updates.get(driverCode)?.source
            });
          }
        });

        setPositions(updates);

        // Update fastest lap
        if (fastestLapNum) {
          const driverCode = DRIVER_NUMBERS[fastestLapNum];
          if (driverCode) {
            setFastestLapDriver(driverCode);
          }
        }

        setCurrentLap(lap);
        apiStatus.recordSuccess();
      },
      30000 // 30 seconds
    );

    return () => openF1.stopAutoUpdate();
  }, [isLive, race?.session_key]);

  const handleManualPosition = (driverCode: string, newPosition: number) => {
    const updates = new Map(positions);
    const current = updates.get(driverCode);

    updates.set(driverCode, {
      driverId: driverCode,
      driverNumber: current?.driverNumber || CODE_TO_NUMBER[driverCode] || 0,
      position: newPosition,
      source: 'manual',
      lastUpdated: new Date(),
      previousSource: current?.source
    });

    setPositions(updates);
  };

  const handleFinalizeRace = async () => {
    if (!race || !league) return;

    try {
      // Calculate results for each player
      const results = league.players?.map(player => {
        const playerPicks = picks.filter(p => p.player_id === player.id);

        const driverResults = playerPicks.map(pick => {
          const finishPos = positions.get(pick.driver_code)?.position || pick.start_position || 0;
          const hasFastestLap = fastestLapDriver === pick.driver_code;

          const score = calculateDriverScore(
            {
              id: pick.driver_code,
              code: pick.driver_code,
              name: pick.driver_name,
              number: pick.driver_number || 0,
              team: pick.team || '',
              startPosition: pick.start_position || 0
            },
            finishPos,
            hasFastestLap
          );

          return {
            driver_code: pick.driver_code,
            start_position: pick.start_position || 0,
            finish_position: finishPos,
            movement_points: score.movementPoints,
            position_bonus: score.bonus,
            fastest_lap_bonus: score.fastestLapPoints,
            total_points: score.score,
            data_source: positions.get(pick.driver_code)?.source || 'manual' as DataSource
          };
        });

        const totalPoints = driverResults.reduce((sum, dr) => sum + dr.total_points, 0);

        return {
          race_id: raceId,
          player_id: player.id,
          total_points: totalPoints,
          fastest_lap_driver: fastestLapDriver,
          driver_results: driverResults,
          finalized_at: new Date().toISOString()
        };
      });

      // Save results
      if (results) {
        const { error } = await supabase
          .from('race_results')
          .insert(results);

        if (error) throw error;

        // Update race status
        await supabase
          .from('races')
          .update({
            results_finalized: true,
            status: 'complete'
          })
          .eq('id', raceId);

        showNotification('Race results finalized!', 'success');
        router.push(`/league/${league.id}/standings`);
      }
    } catch (error) {
      console.error('Failed to finalize race:', error);
      showNotification('Failed to finalize race', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading race...</p>
        </div>
      </div>
    );
  }

  if (!race || !league) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-400">Race not found</p>
      </div>
    );
  }

  // Calculate team totals
  const teamScores = league.players?.map(player => {
    const playerPicks = picks.filter(p => p.player_id === player.id);
    const total = playerPicks.reduce((sum, pick) => {
      const finishPos = positions.get(pick.driver_code)?.position || pick.start_position || 0;
      const hasFastestLap = fastestLapDriver === pick.driver_code;
      const score = calculateDriverScore(
        {
          id: pick.driver_code,
          code: pick.driver_code,
          name: pick.driver_name,
          number: pick.driver_number || 0,
          team: pick.team || '',
          startPosition: pick.start_position || 0
        },
        finishPos,
        hasFastestLap
      );
      return sum + score.score;
    }, 0);

    return { player, total };
  }).sort((a, b) => b.total - a.total) || [];

  const statusColorClass = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }[apiStatus.statusColor];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{race.race_name}</h1>
            <p className="text-gray-400">{race.circuit}</p>
          </div>

          {/* API Status */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColorClass}`} />
            <span className="text-sm text-gray-400">{apiStatus.statusText}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-6 py-3 rounded font-bold ${
              isLive
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isLive ? '🟢 Live Updates ON' : '⚪ Start Live Updates'}
          </button>

          {isLive && (
            <span className="flex items-center text-gray-400">
              Lap {currentLap}
            </span>
          )}
        </div>

        {/* Leaderboard */}
        <div className="mb-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
          <div className="space-y-2">
            {teamScores.map((item, index) => (
              <div
                key={item.player.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.player.color }}
                  />
                  <span className="font-bold">{item.player.display_name}</span>
                </div>
                <span className="text-2xl font-bold">{item.total} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Position Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {league.players?.map(player => {
            const playerPicks = picks.filter(p => p.player_id === player.id);

            return (
              <div key={player.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <h3 className="text-xl font-bold">{player.display_name}</h3>
                </div>

                <div className="space-y-3">
                  {playerPicks.map(pick => {
                    const driverPos = positions.get(pick.driver_code);
                    const finishPos = driverPos?.position || pick.start_position || 0;
                    const hasFastestLap = fastestLapDriver === pick.driver_code;

                    const score = calculateDriverScore(
                      {
                        id: pick.driver_code,
                        code: pick.driver_code,
                        name: pick.driver_name,
                        number: pick.driver_number || 0,
                        team: pick.team || '',
                        startPosition: pick.start_position || 0
                      },
                      finishPos,
                      hasFastestLap
                    );

                    const isAPIData = driverPos?.source === 'api';

                    return (
                      <div
                        key={pick.id}
                        className={`p-4 rounded border-2 ${
                          isAPIData ? 'border-green-500/30' : 'border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-bold">{pick.driver_name}</div>
                            <div className="text-sm text-gray-400">
                              {pick.team} • #{pick.driver_number}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{score.score} pts</div>
                            {isAPIData && (
                              <div className="text-xs text-green-400">API</div>
                            )}
                          </div>
                        </div>

                        {/* Position Input */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">P{pick.start_position} →</span>
                          <input
                            type="number"
                            min="1"
                            max="21"
                            value={finishPos}
                            onChange={(e) => handleManualPosition(pick.driver_code, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center"
                          />
                          {hasFastestLap && (
                            <span className="text-purple-400 text-sm">⚡ Fastest Lap</span>
                          )}
                        </div>

                        {/* Score Breakdown */}
                        <div className="mt-2 text-xs text-gray-400 space-y-1">
                          <div>Movement: {score.movementPoints} pts</div>
                          <div>Position Bonus: {score.bonus} pts</div>
                          {hasFastestLap && <div>Fastest Lap: {score.fastestLapPoints} pts</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fastest Lap Selector */}
        <div className="mb-6 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">⚡ Fastest Lap</h3>
          <select
            value={fastestLapDriver || ''}
            onChange={(e) => setFastestLapDriver(e.target.value || null)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
          >
            <option value="">No fastest lap</option>
            {picks.map(pick => (
              <option key={pick.id} value={pick.driver_code}>
                {pick.driver_name} ({pick.team})
              </option>
            ))}
          </select>
        </div>

        {/* Finalize Button */}
        <div className="bg-blue-900/20 border-2 border-blue-500 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-2">Finalize Results</h3>
          <p className="text-gray-300 mb-4">
            Once the race is finished, finalize the results to save scores and update standings.
          </p>
          <button
            onClick={handleFinalizeRace}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold"
          >
            Finalize Race Results
          </button>
        </div>
      </div>
    </div>
  );
}

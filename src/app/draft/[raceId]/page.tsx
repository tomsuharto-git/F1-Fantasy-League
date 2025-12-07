'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/client';
import { useDraft } from '@/hooks/useDraft';
import { openF1 } from '@/lib/api/openf1';
import { makeDraftPick, undoLastPick, completeDraft } from '@/lib/draft/logic';
import { showNotification } from '@/components/shared/NotificationSystem';
import { ArrowLeft, RotateCcw, CheckCircle, Clock, Flag } from 'lucide-react';
import { DriverCard } from '@/components/draft/DriverCard';
import type { Race, League, Player, Driver } from '@/lib/types';

interface RaceInfo {
  raceName: string;
  circuitName: string;
  country: string;
  raceStart: string | null;
  meetingKey: number;
}

function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const raceId = params.raceId as string;

  const [race, setRace] = useState<Race | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [raceInfo, setRaceInfo] = useState<RaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const countdown = useCountdown(raceInfo?.raceStart || null);

  // Load race, league, and drivers
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch race
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('*')
          .eq('id', raceId)
          .single();

        if (raceError || !raceData) {
          setError('Race not found');
          return;
        }

        setRace(raceData);

        // Fetch league with players
        const { data: leagueData, error: leagueError } = await supabase
          .from('leagues')
          .select(`
            *,
            players(*)
          `)
          .eq('id', raceData.league_id)
          .single();

        if (leagueError || !leagueData) {
          setError('League not found');
          return;
        }

        setLeague(leagueData);

        // Fetch starting grid from OpenF1 API
        const { drivers: gridDrivers, raceInfo: info } = await openF1.getStartingGrid();

        if (gridDrivers.length > 0) {
          setAllDrivers(gridDrivers);
        } else {
          console.warn('OpenF1 API returned no drivers, using empty grid');
          setAllDrivers([]);
        }

        if (info) {
          setRaceInfo(info);
        }
      } catch (err) {
        console.error('Failed to load draft data:', err);
        setError('Failed to load draft data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [raceId]);

  // Load current user
  useEffect(() => {
    async function loadUser() {
      const supabaseClient = createClient();
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    loadUser();
  }, []);

  const draftHook = useDraft({
    raceId,
    players: league?.players || [],
    allDrivers,
    driversPerTeam: league?.drivers_per_team || 4
  });

  const handlePickDriver = async (driver: Driver) => {
    if (!draftHook.currentPickInfo) return;
    if (!isMyTurn) return;

    const { player, pickNumber } = draftHook.currentPickInfo;

    // Optimistic update - show the pick immediately
    draftHook.addOptimisticPick(driver, player.id, pickNumber);

    try {
      await makeDraftPick(raceId, player.id, driver, pickNumber);

      // Sync with server to get the real pick data
      await draftHook.refresh();

      showNotification(`${player.display_name} picked ${driver.name}`, 'success');
    } catch (error) {
      console.error('Failed to make pick:', error);
      // Revert optimistic update on error
      await draftHook.refresh();
      showNotification('Failed to make pick. Try again.', 'error');
    }
  };

  const handleUndo = async () => {
    try {
      const undone = await undoLastPick(raceId);
      if (undone) {
        showNotification('Pick undone', 'info');
        await draftHook.refresh();
      }
    } catch (error) {
      showNotification('Failed to undo pick', 'error');
    }
  };

  const handleComplete = async () => {
    try {
      await completeDraft(raceId);
      showNotification('Draft complete!', 'success');
      router.push(`/league/${league?.id}/waiting-room`);
    } catch (error) {
      showNotification('Failed to complete draft', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2B83E] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading draft...</p>
        </div>
      </div>
    );
  }

  if (error || !race || !league) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error || 'Failed to load draft'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentUserPlayer = league?.players?.find(p => p.user_id === currentUserId);
  const currentPlayer = draftHook.currentPickInfo?.player;
  // Only true if both player IDs exist and match (prevents undefined === undefined being true)
  const isMyTurn = !!(currentPlayer?.id && currentUserPlayer?.id && currentPlayer.id === currentUserPlayer.id);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#1e1e1e]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/league/${league.id}/waiting-room`)}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{league.name}</p>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent">
                  {raceInfo?.raceName || race.race_name}
                </h1>
                {raceInfo && (
                  <p className="text-xs text-gray-400">{raceInfo.circuitName}</p>
                )}
              </div>
            </div>

            {/* Countdown */}
            {countdown && (
              <div className="flex items-center gap-3 bg-[#252525] rounded-lg px-4 py-2 border border-gray-700">
                <Flag className="w-4 h-4 text-[#D2B83E]" />
                <div className="flex items-center gap-2 text-sm font-mono">
                  {countdown.days > 0 && (
                    <span className="text-white">{countdown.days}<span className="text-gray-500 text-xs ml-0.5">d</span></span>
                  )}
                  <span className="text-white">{String(countdown.hours).padStart(2, '0')}<span className="text-gray-500 text-xs ml-0.5">h</span></span>
                  <span className="text-white">{String(countdown.minutes).padStart(2, '0')}<span className="text-gray-500 text-xs ml-0.5">m</span></span>
                  <span className="text-[#D2B83E]">{String(countdown.seconds).padStart(2, '0')}<span className="text-gray-500 text-xs ml-0.5">s</span></span>
                </div>
              </div>
            )}
            {!countdown && raceInfo?.raceStart && (
              <div className="flex items-center gap-2 bg-green-900/30 rounded-lg px-4 py-2 border border-green-700">
                <Flag className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Race in Progress</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Draft Complete Banner */}
        {draftHook.isComplete && (
          <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <span className="font-bold text-white">Draft Complete!</span>
                <span className="text-gray-400 ml-2 text-sm">All teams are set</span>
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              Finish Draft
            </button>
          </div>
        )}

        {/* Team Rosters - Horizontal at top */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {league.players
              ?.sort((a, b) => (a.draft_position || 0) - (b.draft_position || 0))
              .map(player => {
                const playerPicks = draftHook.picks.filter(p => p.player_id === player.id);
                const isCurrentPicker = currentPlayer?.id === player.id;

                // Group picks by tier
                const picksByTier: Record<number, typeof playerPicks> = { 1: [], 2: [], 3: [], 4: [] };
                playerPicks.forEach(pick => {
                  const pos = pick.start_position ?? 20;
                  const tier = pos <= 5 ? 1 : pos <= 10 ? 2 : pos <= 15 ? 3 : 4;
                  picksByTier[tier].push(pick);
                });

                return (
                  <div
                    key={player.id}
                    className={`rounded-lg p-4 border-2 transition-all ${
                      isCurrentPicker
                        ? 'border-opacity-100'
                        : 'border-opacity-30'
                    }`}
                    style={{
                      borderColor: player.color,
                      backgroundColor: isCurrentPicker ? player.color + '10' : '#1e1e1e'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isCurrentPicker && !draftHook.isComplete && (
                          <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: player.color }}
                          />
                        )}
                        <h4
                          className="font-bold text-sm uppercase tracking-wide"
                          style={{ color: player.color }}
                        >
                          {player.display_name}
                        </h4>
                        {isCurrentPicker && !draftHook.isComplete && player.id === currentUserPlayer?.id && (
                          <span className="text-xs bg-[#D2B83E] text-black px-1.5 py-0.5 rounded font-medium animate-pulse">
                            YOUR PICK
                          </span>
                        )}
                        {isCurrentPicker && !draftHook.isComplete && player.id !== currentUserPlayer?.id && (
                          <span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">
                            PICKING NOW
                          </span>
                        )}
                      </div>
                      {isCurrentPicker && !draftHook.isComplete && draftHook.currentPickInfo && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {draftHook.currentPickInfo.pickNumber}/{draftHook.currentPickInfo.totalPicks}
                          </span>
                          <button
                            onClick={handleUndo}
                            disabled={draftHook.picks.length === 0}
                            className={`p-1 rounded transition-colors ${
                              draftHook.picks.length === 0
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                            }`}
                            title="Undo Last Pick"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {[1, 2, 3, 4].map(tier => {
                        const tierPick = picksByTier[tier][0];
                        const tierColors: Record<number, string> = {
                          1: 'bg-purple-600',
                          2: 'bg-blue-600',
                          3: 'bg-green-600',
                          4: 'bg-orange-600'
                        };

                        // Find the full driver object for the pick, or construct from pick data
                        const draftedDriver = tierPick
                          ? allDrivers.find(d => d.code === tierPick.driver_code || d.name === tierPick.driver_name)
                            || {
                              id: tierPick.driver_code,
                              code: tierPick.driver_code,
                              name: tierPick.driver_name,
                              number: tierPick.driver_number || 0,
                              team: tierPick.team || '',
                              startPosition: tierPick.start_position || 0,
                              tier
                            }
                          : null;

                        return (
                          <div key={tier}>
                            {draftedDriver ? (
                              <DriverCard
                                driver={draftedDriver}
                              />
                            ) : (
                              <div className="flex items-center gap-2 h-[80px] border border-dashed border-gray-600 rounded-[14px] px-4">
                                <span className={`${tierColors[tier]} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>
                                  T{tier}
                                </span>
                                <span className="text-gray-500 text-sm italic">Not drafted</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Available Drivers - Horizontal tiers with driver cards */}
        <div>
          <h3 className="text-xl font-bold mb-4">Available Drivers</h3>

          {(() => {
            // Calculate which tiers the current user has already filled
            const myPicks = currentUserPlayer
              ? draftHook.picks.filter(p => p.player_id === currentUserPlayer.id)
              : [];
            const myFilledTiers = new Set<number>(
              myPicks.map(pick => {
                const pos = pick.start_position ?? 20;
                return pos <= 5 ? 1 : pos <= 10 ? 2 : pos <= 15 ? 3 : 4;
              })
            );

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(tier => {
                  const tierDrivers = draftHook.availableDrivers.filter(d => d.tier === tier);
                  const tierNames: Record<number, string> = {
                    1: 'Tier 1',
                    2: 'Tier 2',
                    3: 'Tier 3',
                    4: 'Tier 4'
                  };
                  const tierColors: Record<number, string> = {
                    1: 'bg-purple-600',
                    2: 'bg-blue-600',
                    3: 'bg-green-600',
                    4: 'bg-orange-600'
                  };

                  // Check if current user already has a driver from this tier
                  const tierAlreadyFilled = myFilledTiers.has(tier);

                  return (
                    <div key={tier} className="flex flex-col">
                      <div className={`${tierColors[tier]} text-white text-sm font-bold px-3 py-1.5 rounded-lg inline-block w-fit mb-3 transition-opacity ${tierAlreadyFilled ? 'opacity-30' : ''}`}>
                        {tierNames[tier]}
                      </div>

                      <div className="space-y-3 flex-1">
                        {tierDrivers.map(driver => (
                          <DriverCard
                            key={driver.code}
                            driver={driver}
                            onClick={() => handlePickDriver(driver)}
                            disabled={draftHook.isComplete || tierAlreadyFilled}
                          />
                        ))}
                        {tierDrivers.length === 0 && (
                          <p className="text-gray-500 text-sm italic text-center py-4">All drafted</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}

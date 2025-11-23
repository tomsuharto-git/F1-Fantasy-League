'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/client';
import { useDraft } from '@/hooks/useDraft';
import { openF1 } from '@/lib/api/openf1';
import { getDriverInfo } from '@/lib/drivers';
import { makeDraftPick, undoLastPick, completeDraft } from '@/lib/draft/logic';
import { showNotification } from '@/components/shared/NotificationSystem';
import { ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';
import { DriverCard } from '@/components/draft/DriverCard';
import type { Race, League, Player, Driver } from '@/lib/types';

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const raceId = params.raceId as string;

  const [race, setRace] = useState<Race | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

        // Vegas GP Starting Grid (Hardcoded)
        const vegasGrid: Driver[] = [
          // Tier 1 (P1-P5)
          { id: 'NOR', code: 'NOR', name: 'Lando Norris', number: 4, team: 'McLaren', startPosition: 1, tier: 1 },
          { id: 'VER', code: 'VER', name: 'Max Verstappen', number: 1, team: 'Red Bull Racing', startPosition: 2, tier: 1 },
          { id: 'SAI', code: 'SAI', name: 'Carlos Sainz', number: 55, team: 'Williams', startPosition: 3, tier: 1 },
          { id: 'RUS', code: 'RUS', name: 'George Russell', number: 63, team: 'Mercedes', startPosition: 4, tier: 1 },
          { id: 'PIA', code: 'PIA', name: 'Oscar Piastri', number: 81, team: 'McLaren', startPosition: 5, tier: 1 },
          // Tier 2 (P6-P10)
          { id: 'LAW', code: 'LAW', name: 'Liam Lawson', number: 30, team: 'Red Bull Racing', startPosition: 6, tier: 2 },
          { id: 'ALO', code: 'ALO', name: 'Fernando Alonso', number: 14, team: 'Aston Martin', startPosition: 7, tier: 2 },
          { id: 'HAD', code: 'HAD', name: 'Isack Hadjar', number: 21, team: 'Racing Bulls', startPosition: 8, tier: 2 },
          { id: 'LEC', code: 'LEC', name: 'Charles Leclerc', number: 16, team: 'Ferrari', startPosition: 9, tier: 2 },
          { id: 'GAS', code: 'GAS', name: 'Pierre Gasly', number: 10, team: 'Alpine', startPosition: 10, tier: 2 },
          // Tier 3 (P11-P15)
          { id: 'HUL', code: 'HUL', name: 'Nico Hulkenberg', number: 27, team: 'Kick Sauber', startPosition: 11, tier: 3 },
          { id: 'STR', code: 'STR', name: 'Lance Stroll', number: 18, team: 'Aston Martin', startPosition: 12, tier: 3 },
          { id: 'OCO', code: 'OCO', name: 'Esteban Ocon', number: 31, team: 'Haas', startPosition: 13, tier: 3 },
          { id: 'BEA', code: 'BEA', name: 'Oliver Bearman', number: 87, team: 'Haas', startPosition: 14, tier: 3 },
          { id: 'COL', code: 'COL', name: 'Franco Colapinto', number: 43, team: 'Williams', startPosition: 15, tier: 3 },
          // Tier 4 (P16-P20)
          { id: 'ALB', code: 'ALB', name: 'Alex Albon', number: 23, team: 'Williams', startPosition: 16, tier: 4 },
          { id: 'ANT', code: 'ANT', name: 'Kimi Antonelli', number: 12, team: 'Mercedes', startPosition: 17, tier: 4 },
          { id: 'BOR', code: 'BOR', name: 'Gabriel Bortoleto', number: 5, team: 'Kick Sauber', startPosition: 18, tier: 4 },
          { id: 'TSU', code: 'TSU', name: 'Yuki Tsunoda', number: 22, team: 'Racing Bulls', startPosition: 19, tier: 4 },
          { id: 'HAM', code: 'HAM', name: 'Lewis Hamilton', number: 44, team: 'Ferrari', startPosition: 20, tier: 4 },
        ];

        setAllDrivers(vegasGrid);
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

    try {
      await makeDraftPick(
        raceId,
        draftHook.currentPickInfo.player.id,
        driver,
        draftHook.currentPickInfo.pickNumber
      );

      showNotification(
        `${draftHook.currentPickInfo.player.display_name} picked ${driver.name}`,
        'success'
      );
    } catch (error) {
      console.error('Failed to make pick:', error);
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
  const isMyTurn = currentPlayer?.id === currentUserPlayer?.id;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#1e1e1e]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/league/${league.id}/waiting-room`)}
              className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent">
                {race.race_name} Draft
              </h1>
              <p className="text-sm text-gray-400">{league.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Current Pick Info */}
        {!draftHook.isComplete && draftHook.currentPickInfo && (
          <div
            className="mb-6 p-6 rounded-lg border-2"
            style={{
              backgroundColor: currentPlayer?.color + '20',
              borderColor: currentPlayer?.color
            }}
          >
            <div>
              <p className="text-sm text-gray-400">
                Pick {draftHook.currentPickInfo.pickNumber} of {draftHook.currentPickInfo.totalPicks}
              </p>
              <h2 className="text-2xl font-bold">
                {currentPlayer?.display_name}'s turn
                {isMyTurn && <span className="ml-2 text-sm text-[#D2B83E]">(You)</span>}
              </h2>
            </div>
          </div>
        )}

        {/* Draft Complete Banner */}
        {draftHook.isComplete && (
          <div className="mb-6 p-6 bg-green-900/20 border-2 border-green-500 rounded-lg">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Draft Complete!
            </h2>
            <p className="text-gray-300 mb-4">All teams are set. Good luck in the race!</p>
            <button
              onClick={handleComplete}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              Finish Draft
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6">
          <button
            onClick={handleUndo}
            disabled={draftHook.picks.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              draftHook.picks.length === 0
                ? 'bg-[#1e1e1e] text-gray-600 cursor-not-allowed'
                : 'bg-[#252525] hover:bg-[#2a2a2a] border border-gray-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Undo Last Pick
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Drivers */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">Available Drivers</h3>

            {/* Group by tier */}
            {[1, 2, 3, 4].map(tier => {
              const tierDrivers = draftHook.availableDrivers.filter(d => d.tier === tier);
              if (tierDrivers.length === 0) return null;

              return (
                <div key={tier} className="mb-6">
                  <h4 className="text-sm font-medium mb-3 text-gray-400 uppercase tracking-wide">
                    {tier === 1 && 'Tier 1: Front Runners (P1-P5)'}
                    {tier === 2 && 'Tier 2: Midfield (P6-P10)'}
                    {tier === 3 && 'Tier 3: Back Markers (P11-P15)'}
                    {tier === 4 && 'Tier 4: Rookies & Reserves (P16-P20)'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tierDrivers.map(driver => (
                      <DriverCard
                        key={driver.code}
                        driver={driver}
                        onClick={() => handlePickDriver(driver)}
                        disabled={!isMyTurn || draftHook.isComplete}
                        isMyTurn={isMyTurn && !draftHook.isComplete}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team Rosters */}
          <div>
            <h3 className="text-xl font-bold mb-4">Team Rosters</h3>

            <div className="space-y-4">
              {league.players
                ?.sort((a, b) => (a.draft_position || 0) - (b.draft_position || 0))
                .map(player => {
                  const playerPicks = draftHook.picks.filter(p => p.player_id === player.id);

                  return (
                    <div key={player.id} className="bg-[#252525] rounded-lg p-4 border border-gray-800">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <h4 className="font-bold">{player.display_name}</h4>
                        <span className="text-xs text-gray-500">
                          ({playerPicks.length}/{league.drivers_per_team})
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {playerPicks.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No picks yet</p>
                        ) : (
                          playerPicks.map(pick => (
                            <div key={pick.id} className="text-sm bg-[#1e1e1e] rounded p-2">
                              <div className="font-medium">{pick.driver_name}</div>
                              <div className="text-gray-400 text-xs">
                                {pick.team} • P{pick.start_position}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

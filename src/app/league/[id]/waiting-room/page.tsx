'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/client';
import { useLeague } from '@/hooks/useLeague';
import { usePlayerReadyRealtime } from '@/hooks/useRealtime';
import { showNotification } from '@/components/shared/NotificationSystem';
import { startDraft } from '@/lib/league/operations';
import { ArrowLeft, Share2, Info, Shuffle, Users, Flag, Clock } from 'lucide-react';

interface WaitingRoomProps {
  params: {
    id: string;
  };
}

export default function WaitingRoomPage({ params }: WaitingRoomProps) {
  const router = useRouter();
  const supabase = createClient();
  const { league, loading, error, toggleReady, refresh } = useLeague(params.id);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [draftOrder, setDraftOrder] = useState<'random' | 'manual'>('random');
  const [manualOrder, setManualOrder] = useState<string[]>([]);

  // Get current authenticated user
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/signin');
          return;
        }

        setCurrentUserId(user.id);
      } catch (error) {
        console.error('Failed to load user:', error);
        router.push('/signin');
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, [router, supabase]);

  // Initialize manual order when players change
  useEffect(() => {
    if (league?.players) {
      const playerIds = league.players.map(p => p.id);
      // Only update if manualOrder is empty or has different players
      if (manualOrder.length === 0) {
        setManualOrder(playerIds);
      } else if (manualOrder.length !== playerIds.length) {
        // Players were added/removed - reset manual order
        setManualOrder(playerIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league?.players]);

  // Real-time updates for player ready status
  usePlayerReadyRealtime(params.id, () => {
    refresh();
  });

  // Share or copy link
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/join/${league?.share_code}`;

    // Try native share first (mobile + some desktop browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${league?.name}`,
          text: `Join my F1 fantasy league: ${league?.name}`,
          url: shareUrl
        });
        showNotification('Share successful!', 'success');
        return;
      } catch (error) {
        // User cancelled or share failed, fall back to copy
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }

    // Fallback to clipboard copy
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showNotification('Share link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle current player ready status
  const handleToggleReady = async () => {
    const currentPlayer = league?.players?.find(p => p.user_id === currentUserId);
    if (!currentPlayer) return;

    await toggleReady(currentPlayer.id, !currentPlayer.is_ready);
  };

  // Move player up in manual order
  const movePlayerUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...manualOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setManualOrder(newOrder);
  };

  // Move player down in manual order
  const movePlayerDown = (index: number) => {
    if (index === manualOrder.length - 1) return;
    const newOrder = [...manualOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setManualOrder(newOrder);
  };

  // Get players in display order
  const getDisplayPlayers = () => {
    if (!league?.players) return [];

    if (draftOrder === 'random') {
      return [...league.players];
    }

    // Manual order - sort by manualOrder array
    return manualOrder
      .map(id => league.players?.find(p => p.id === id))
      .filter(Boolean) as typeof league.players;
  };

  // Check if all players are ready
  const claimedPlayers = league?.players?.filter(p => p.user_id) || [];
  const allPlayersReady = claimedPlayers.length >= 2 &&
                          claimedPlayers.every(p => p.is_ready);

  // Check if current user is creator
  const isCreator = league?.created_by === currentUserId;

  // Start draft
  const handleStartDraft = async () => {
    try {
      showNotification('Starting draft...', 'info');

      const raceId = await startDraft(
        params.id,
        draftOrder,
        draftOrder === 'manual' ? manualOrder : undefined
      );

      showNotification('Draft started!', 'success');
      router.push(`/draft/${raceId}`);
    } catch (error) {
      console.error('Failed to start draft:', error);
      showNotification('Failed to start draft. Please try again.', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2B83E] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">League not found</p>
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

  const currentPlayer = league.players?.find(p => p.user_id === currentUserId);
  const shareUrl = `${window.location.origin}/join/${league.share_code}`;
  const teamCount = league.players?.length || 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#1e1e1e]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src="/grid-kings-logo-transparent.png"
              alt="Grid Kings"
              className="h-10 w-auto"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent">
            Draft Waiting Room
          </h1>
          <p className="text-gray-400">
            {league.name} • {league.drivers_per_team} drivers per team • {teamCount} {teamCount === 1 ? 'team' : 'teams'}
          </p>
        </div>

        {/* Share Link Section */}
        <div className="bg-[#252525] rounded-lg p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Invite Players
          </h2>
          <p className="text-gray-400 mb-4">
            Share this link with your friends to join the league:
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-[#1e1e1e] border border-gray-700 rounded focus:outline-none text-white"
            />
            <button
              onClick={handleShare}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                copied
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829]'
              }`}
            >
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-[#1e1e1e] border border-gray-700 rounded flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#D2B83E]" />
            <p className="text-sm text-gray-300">
              <strong>Share Code:</strong> {league.share_code}
            </p>
          </div>
        </div>

        {/* Draft Order Selection (Creator Only) */}
        {isCreator && (
          <div className="bg-[#252525] rounded-lg p-6 mb-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shuffle className="w-5 h-5" />
              Draft Order
            </h2>

            <div className="space-y-3 mb-4">
              <label className={`flex items-start p-4 rounded-lg cursor-pointer transition-all border ${
                draftOrder === 'random'
                  ? 'bg-[#1e1e1e] border-[#D2B83E]'
                  : 'bg-[#1e1e1e] border-gray-800 hover:border-gray-700'
              }`}>
                <input
                  type="radio"
                  name="draftOrder"
                  checked={draftOrder === 'random'}
                  onChange={() => setDraftOrder('random')}
                  className="mt-1 mr-4 accent-[#D2B83E]"
                />
                <div className="flex-1">
                  <div className="font-medium">Random Order</div>
                  <div className="text-sm text-gray-400 mt-1">Teams will be randomly assigned draft positions</div>
                </div>
              </label>

              <label className={`flex items-start p-4 rounded-lg cursor-pointer transition-all border ${
                draftOrder === 'manual'
                  ? 'bg-[#1e1e1e] border-[#D2B83E]'
                  : 'bg-[#1e1e1e] border-gray-800 hover:border-gray-700'
              }`}>
                <input
                  type="radio"
                  name="draftOrder"
                  checked={draftOrder === 'manual'}
                  onChange={() => setDraftOrder('manual')}
                  className="mt-1 mr-4 accent-[#D2B83E]"
                />
                <div className="flex-1">
                  <div className="font-medium">Manual Order</div>
                  <div className="text-sm text-gray-400 mt-1">Drag teams to reorder the draft</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="bg-[#252525] rounded-lg p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams ({teamCount})
          </h2>

          <div className="space-y-3">
            {getDisplayPlayers().map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded-lg border border-gray-800"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Manual reorder controls (creator only) */}
                  {isCreator && draftOrder === 'manual' && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => movePlayerUp(index)}
                        disabled={index === 0}
                        className="text-gray-500 hover:text-[#D2B83E] disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => movePlayerDown(index)}
                        disabled={index === getDisplayPlayers().length - 1}
                        className="text-gray-500 hover:text-[#D2B83E] disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  )}

                  {/* Color indicator */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.display_name?.[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Player name */}
                  <div>
                    <p className="font-medium">
                      {player.display_name}
                      {player.user_id === currentUserId && (
                        <span className="ml-2 text-xs text-[#D2B83E]">(You)</span>
                      )}
                      {league.created_by === player.user_id && (
                        <span className="ml-2 text-xs text-gray-400">(Creator)</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Ready status */}
                <div className="flex items-center gap-2">
                  {player.user_id ? (
                    player.is_ready ? (
                      <span className="text-green-400 font-medium">Ready</span>
                    ) : (
                      <span className="text-gray-500">Not Ready</span>
                    )
                  ) : (
                    <span className="text-yellow-400 text-sm">Waiting...</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Current player ready toggle */}
          {currentPlayer && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={handleToggleReady}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  currentPlayer.is_ready
                    ? 'bg-[#2a2a2a] hover:bg-[#333333] border border-gray-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {currentPlayer.is_ready ? 'Mark as Not Ready' : 'Mark as Ready'}
              </button>
            </div>
          )}
        </div>

        {/* Start Draft Section */}
        {allPlayersReady && isCreator && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2 text-green-400 flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Ready to Draft!
            </h3>
            <p className="text-green-200 mb-4">
              All players are ready. Start the draft when you're all set!
            </p>
            <button
              onClick={handleStartDraft}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
            >
              Start Draft
            </button>
          </div>
        )}

        {/* Waiting message */}
        {!allPlayersReady && (
          <div className="bg-[#252525] border border-gray-700 rounded-lg p-6">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Waiting for players...
            </h3>
            <p className="text-gray-400 text-sm">
              {claimedPlayers.length < 2
                ? 'Need at least 2 players to start the draft. Share the code above to invite friends!'
                : 'The draft will start once all players mark themselves as ready.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

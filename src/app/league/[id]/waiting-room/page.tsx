'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/hooks/useLeague';
import { usePlayerReadyRealtime } from '@/hooks/useRealtime';
import { showNotification } from '@/components/shared/NotificationSystem';

interface WaitingRoomProps {
  params: {
    id: string;
  };
}

export default function WaitingRoomPage({ params }: WaitingRoomProps) {
  const router = useRouter();
  const { league, loading, error, toggleReady, refresh } = useLeague(params.id);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Get current player from localStorage
  useEffect(() => {
    const playerId = localStorage.getItem(`league_${params.id}_player`);
    setCurrentPlayerId(playerId);
  }, [params.id]);

  // Real-time updates for player ready status
  usePlayerReadyRealtime(params.id, () => {
    refresh();
  });

  // Copy share link
  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/join/${league?.share_code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showNotification('Share link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle current player ready status
  const handleToggleReady = async () => {
    if (!currentPlayerId) return;
    
    const currentPlayer = league?.players?.find(p => p.id === currentPlayerId);
    if (!currentPlayer) return;

    await toggleReady(currentPlayerId, !currentPlayer.is_ready);
  };

  // Check if all players are ready
  const allPlayersReady = league?.players?.every(p => p.is_ready) && 
                          (league?.players?.length || 0) >= 2;

  // Start draft
  const handleStartDraft = () => {
    // TODO: Create race and navigate to draft
    showNotification('Draft starting...', 'success');
    // router.push(`/draft/${raceId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading league...</p>
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
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = league.players?.find(p => p.id === currentPlayerId);
  const shareUrl = `${window.location.origin}/join/${league.share_code}`;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{league.name}</h1>
          <p className="text-gray-400">
            {league.drivers_per_team} drivers per team • {league.players?.length || 0} teams
          </p>
        </div>

        {/* Share Link Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📤 Invite Players</h2>
          <p className="text-gray-400 mb-4">
            Share this link with your friends to join the league:
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
            />
            <button
              onClick={copyShareLink}
              className={`px-4 py-2 rounded font-bold transition-colors ${
                copied 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-900 border border-blue-700 rounded">
            <p className="text-sm text-blue-200">
              💡 <strong>Share Code:</strong> {league.share_code}
            </p>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            👥 Teams ({league.players?.length || 0})
          </h2>

          <div className="space-y-3">
            {league.players?.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded"
              >
                <div className="flex items-center gap-3">
                  {/* Color indicator */}
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  
                  {/* Player name */}
                  <div>
                    <p className="font-medium">
                      {player.display_name}
                      {player.id === currentPlayerId && (
                        <span className="ml-2 text-xs text-blue-400">(You)</span>
                      )}
                    </p>
                    {player.draft_position && (
                      <p className="text-sm text-gray-400">
                        Draft position: {player.draft_position}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ready status */}
                <div className="flex items-center gap-2">
                  {player.is_ready ? (
                    <span className="text-green-400 font-medium">✓ Ready</span>
                  ) : (
                    <span className="text-gray-400">Not Ready</span>
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
                className={`w-full py-3 rounded font-bold transition-colors ${
                  currentPlayer.is_ready
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {currentPlayer.is_ready ? 'Mark as Not Ready' : 'Mark as Ready'}
              </button>
            </div>
          )}
        </div>

        {/* Start Draft Section */}
        {allPlayersReady && (
          <div className="bg-green-900 border border-green-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">🏁 Ready to Draft!</h3>
            <p className="text-green-200 mb-4">
              All players are ready. Start the draft when you're all set!
            </p>
            <button
              onClick={handleStartDraft}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold"
            >
              Start Draft
            </button>
          </div>
        )}

        {/* Waiting message */}
        {!allPlayersReady && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="font-bold mb-2">⏳ Waiting for players...</h3>
            <p className="text-gray-400 text-sm">
              The draft will start once all players mark themselves as ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

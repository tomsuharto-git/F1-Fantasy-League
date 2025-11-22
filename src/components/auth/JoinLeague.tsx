'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/client';
import { showNotification } from '@/components/shared/NotificationSystem';
import { ColorPicker } from '@/components/shared/ColorPicker';
import type { League, Player } from '@/lib/types';

interface JoinLeagueProps {
  league: League;
}

export function JoinLeague({ league }: JoinLeagueProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('');

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          // Store current path for redirect after signin
          const currentPath = window.location.pathname;
          sessionStorage.setItem('redirectAfterSignin', currentPath);
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
      } catch (error) {
        console.error('Failed to check auth:', error);
        showNotification('Failed to load', 'error');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [league.id, league.players, router, supabase]);

  const handleJoin = async () => {
    if (!teamName.trim() || !teamColor || !currentUser) return;

    try {
      setJoiningLoading(true);

      // Get used colors
      const usedColors = league.players?.map(p => p.color) || [];
      if (usedColors.includes(teamColor)) {
        showNotification('This color is already taken. Please choose another.', 'error');
        return;
      }

      // Create new player for this user
      const { error } = await supabase
        .from('players')
        .insert({
          league_id: league.id,
          user_id: currentUser.id,
          display_name: teamName.trim(),
          color: teamColor,
          draft_position: null, // Assigned when draft starts
          is_ready: false,
          is_verified: true
        });

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

  const usedColors = league.players?.map(p => p.color) || [];
  const canJoin = teamName.trim().length > 0 && teamColor.length > 0;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-[#252525] rounded-lg p-8 border border-gray-800">
        <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent">
          Join {league.name}
        </h1>
        <p className="text-gray-400 mb-6">
          Choose your team name and color
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
              className="w-full px-4 py-3 bg-[#1e1e1e] border border-gray-700 rounded-lg focus:outline-none focus:border-[#D2B83E] transition-colors text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-300">Team Color</label>
            <ColorPicker
              value={teamColor}
              onChange={setTeamColor}
              usedColors={usedColors}
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!canJoin || joiningLoading}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              canJoin && !joiningLoading
                ? 'bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] text-white shadow-md'
                : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
            }`}
          >
            {joiningLoading ? 'Joining...' : 'Join League'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeague } from '@/lib/league/operations';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { showNotification } from '@/components/shared/NotificationSystem';
import type { CreateLeagueInput } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';

export default function CreateLeaguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateLeagueInput>({
    name: '',
    type: 'season_league',
    max_races: 1,
    drivers_per_team: 4,
    creator_team: { name: '', color: '' }
  });

  const updateFormData = (updates: Partial<CreateLeagueInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateCreatorTeam = (updates: Partial<{ name: string; color: string }>) => {
    setFormData(prev => ({
      ...prev,
      creator_team: { ...prev.creator_team, ...updates }
    }));
  };

  const canCreateLeague =
    formData.name.trim().length > 0 &&
    formData.creator_team.name.trim().length > 0 &&
    formData.creator_team.color.length > 0;

  const handleCreate = async () => {
    try {
      setLoading(true);
      const league = await createLeague(formData);

      showNotification('League created successfully!', 'success');
      router.push(`/league/${league.id}/waiting-room`);
    } catch (error) {
      console.error('Failed to create league:', error);
      showNotification('Failed to create league. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

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

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent">
          Create New League
        </h1>

        <div className="bg-[#252525] rounded-lg p-8 border border-gray-800">
          <div className="space-y-6">
            {/* League Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">League Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Enter league name"
                className="w-full px-4 py-3 bg-[#1e1e1e] border border-gray-700 rounded-lg focus:outline-none focus:border-[#D2B83E] transition-colors text-white"
                autoFocus
              />
            </div>

            {/* Your Team */}
            <div className="pt-4 border-t border-gray-700">
              <h2 className="text-lg font-bold mb-4">Your Team</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-400">Team Name</label>
                  <input
                    type="text"
                    value={formData.creator_team.name}
                    onChange={(e) => updateCreatorTeam({ name: e.target.value })}
                    placeholder="Enter your team name"
                    className="w-full px-4 py-3 bg-[#1e1e1e] border border-gray-700 rounded-lg focus:outline-none focus:border-[#D2B83E] transition-colors text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-400">Team Color</label>
                  <ColorPicker
                    value={formData.creator_team.color}
                    onChange={(color) => updateCreatorTeam({ color })}
                    usedColors={[]}
                  />
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-[#1e1e1e] border border-gray-700 p-5 rounded-lg">
              <h3 className="font-medium mb-3 text-[#D2B83E]">What happens next?</h3>
              <ol className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#D2B83E] font-bold">1.</span>
                  <span>Share the league code with friends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D2B83E] font-bold">2.</span>
                  <span>Friends join and choose their team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D2B83E] font-bold">3.</span>
                  <span>Start the draft when everyone's ready!</span>
                </li>
              </ol>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={!canCreateLeague || loading}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                canCreateLeague && !loading
                  ? 'bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] text-white shadow-md'
                  : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Creating League...' : 'Create League'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeague } from '@/lib/league/operations';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { showNotification } from '@/components/shared/NotificationSystem';
import type { CreateLeagueInput } from '@/lib/types';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react';

type Step = 'basic' | 'teams' | 'draft-order';

export default function CreateLeaguePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateLeagueInput>({
    name: '',
    type: 'season_league',
    max_races: 1,
    drivers_per_team: 4,
    teams: [
      { name: '', color: '' },
      { name: '', color: '' }
    ],
    draft_order: 'random'
  });

  const updateFormData = (updates: Partial<CreateLeagueInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addTeam = () => {
    if (formData.teams.length >= 10) {
      showNotification('Maximum 10 teams allowed', 'warning');
      return;
    }
    const newTeams = [...formData.teams, { name: '', color: '' }];
    const driversPerTeam = newTeams.length <= 5 ? 4 : 2;
    updateFormData({
      teams: newTeams,
      drivers_per_team: driversPerTeam
    });
  };

  const removeTeam = (index: number) => {
    if (formData.teams.length <= 2) {
      showNotification('Minimum 2 teams required', 'warning');
      return;
    }
    const newTeams = formData.teams.filter((_, i) => i !== index);
    const driversPerTeam = newTeams.length <= 5 ? 4 : 2;
    updateFormData({
      teams: newTeams,
      drivers_per_team: driversPerTeam
    });
  };

  const updateTeam = (index: number, updates: Partial<{ name: string; color: string }>) => {
    const newTeams = [...formData.teams];
    newTeams[index] = { ...newTeams[index], ...updates };
    updateFormData({ teams: newTeams });
  };

  const canProceedFromBasic = formData.name.trim().length > 0;
  const canProceedFromTeams = formData.teams.every(team =>
    team.name.trim().length > 0 && team.color.length > 0
  );

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

  const usedColors = formData.teams.map(t => t.color);

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
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent">
          Create New League
        </h1>

        {/* Step Indicators */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${currentStep === 'basic' ? 'text-[#D2B83E]' : 'text-gray-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              currentStep === 'basic'
                ? 'bg-gradient-to-r from-[#D2B83E] to-[#B42518] text-white'
                : 'bg-[#2a2a2a] border border-gray-700'
            }`}>1</div>
            <span className="ml-2 font-medium">Basic Info</span>
          </div>

          <div className="w-16 h-px bg-gray-700 mx-4" />

          <div className={`flex items-center ${currentStep === 'teams' ? 'text-[#D2B83E]' : 'text-gray-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              currentStep === 'teams'
                ? 'bg-gradient-to-r from-[#D2B83E] to-[#B42518] text-white'
                : 'bg-[#2a2a2a] border border-gray-700'
            }`}>2</div>
            <span className="ml-2 font-medium">Teams</span>
          </div>

          <div className="w-16 h-px bg-gray-700 mx-4" />

          <div className={`flex items-center ${currentStep === 'draft-order' ? 'text-[#D2B83E]' : 'text-gray-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              currentStep === 'draft-order'
                ? 'bg-gradient-to-r from-[#D2B83E] to-[#B42518] text-white'
                : 'bg-[#2a2a2a] border border-gray-700'
            }`}>3</div>
            <span className="ml-2 font-medium">Draft Order</span>
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 'basic' && (
          <div className="bg-[#252525] rounded-lg p-8 border border-gray-800">
            <div className="space-y-6">
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
                <p className="text-sm text-gray-400 mt-2">You can add races to your league later</p>
              </div>

              <button
                onClick={() => setCurrentStep('teams')}
                disabled={!canProceedFromBasic}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  canProceedFromBasic
                    ? 'bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] text-white shadow-md'
                    : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
                }`}
              >
                Next: Set Up Teams
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Teams */}
        {currentStep === 'teams' && (
          <div className="bg-[#252525] rounded-lg p-8 border border-gray-800">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Team Setup</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {formData.teams.length} teams × {formData.drivers_per_team} drivers = {formData.teams.length * formData.drivers_per_team} total picks
                  </p>
                </div>
                <button
                  onClick={addTeam}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] text-white rounded-lg transition-all font-medium shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Add Team
                </button>
              </div>

              {formData.teams.map((team, index) => (
                <div key={index} className="p-6 bg-[#1e1e1e] rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-300">Team {index + 1}</h3>
                    {formData.teams.length > 2 && (
                      <button
                        onClick={() => removeTeam(index)}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">Team Name</label>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => updateTeam(index, { name: e.target.value })}
                        placeholder={`Player ${index + 1}`}
                        className="w-full px-4 py-2 bg-[#252525] border border-gray-700 rounded-lg focus:outline-none focus:border-[#D2B83E] transition-colors text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-gray-400">Team Color</label>
                      <ColorPicker
                        value={team.color}
                        onChange={(color) => updateTeam(index, { color })}
                        usedColors={usedColors.filter((_, i) => i !== index)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep('basic')}
                  className="flex-1 py-3 bg-[#2a2a2a] hover:bg-[#333333] rounded-lg font-medium border border-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep('draft-order')}
                  disabled={!canProceedFromTeams}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    canProceedFromTeams
                      ? 'bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] text-white shadow-md'
                      : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next: Draft Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Draft Order */}
        {currentStep === 'draft-order' && (
          <div className="bg-[#252525] rounded-lg p-8 border border-gray-800">
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Draft Order</h2>

              <div className="space-y-3">
                <label className={`flex items-start p-5 rounded-lg cursor-pointer transition-all border ${
                  formData.draft_order === 'random'
                    ? 'bg-[#1e1e1e] border-[#D2B83E]'
                    : 'bg-[#1e1e1e] border-gray-800 hover:border-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="draftOrder"
                    checked={formData.draft_order === 'random'}
                    onChange={() => updateFormData({ draft_order: 'random' })}
                    className="mt-1 mr-4 accent-[#D2B83E]"
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      Random Order
                      {formData.draft_order === 'random' && <Check className="w-4 h-4 text-[#D2B83E]" />}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Teams will be randomly assigned draft positions</div>
                  </div>
                </label>

                <label className={`flex items-start p-5 rounded-lg cursor-pointer transition-all border ${
                  formData.draft_order === 'manual'
                    ? 'bg-[#1e1e1e] border-[#D2B83E]'
                    : 'bg-[#1e1e1e] border-gray-800 hover:border-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="draftOrder"
                    checked={formData.draft_order === 'manual'}
                    onChange={() => updateFormData({ draft_order: 'manual' })}
                    className="mt-1 mr-4 accent-[#D2B83E]"
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      Manual Order
                      {formData.draft_order === 'manual' && <Check className="w-4 h-4 text-[#D2B83E]" />}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Draft order: {formData.teams.map((t, i) => t.name || `Team ${i+1}`).join(' → ')}
                    </div>
                  </div>
                </label>
              </div>

              <div className="bg-[#1e1e1e] border border-gray-700 p-5 rounded-lg">
                <h3 className="font-medium mb-3 text-[#D2B83E]">What happens next?</h3>
                <ol className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#D2B83E] font-bold">1.</span>
                    <span>You'll get a share link to send to players</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D2B83E] font-bold">2.</span>
                    <span>Everyone joins the waiting room</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D2B83E] font-bold">3.</span>
                    <span>When all ready, start the snake draft</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D2B83E] font-bold">4.</span>
                    <span>Score points during the race!</span>
                  </li>
                </ol>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep('teams')}
                  className="flex-1 py-3 bg-[#2a2a2a] hover:bg-[#333333] rounded-lg font-medium border border-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] text-white rounded-lg font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create League'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

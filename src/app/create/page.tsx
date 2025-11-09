'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeague } from '@/lib/league/operations';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { showNotification } from '@/components/shared/NotificationSystem';
import type { CreateLeagueInput } from '@/lib/types';

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
      
      // Store the first player as the current user (league creator)
      if (league.players && league.players.length > 0) {
        localStorage.setItem(`league_${league.id}_player`, league.players[0].id);
      }
      
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
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New League</h1>

        {/* Step Indicators */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${currentStep === 'basic' ? 'text-blue-500' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'basic' ? 'bg-blue-500 text-white' : 'bg-gray-700'
            }`}>1</div>
            <span className="ml-2">Basic Info</span>
          </div>
          
          <div className="w-16 h-px bg-gray-700 mx-4" />
          
          <div className={`flex items-center ${currentStep === 'teams' ? 'text-blue-500' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'teams' ? 'bg-blue-500 text-white' : 'bg-gray-700'
            }`}>2</div>
            <span className="ml-2">Teams</span>
          </div>
          
          <div className="w-16 h-px bg-gray-700 mx-4" />
          
          <div className={`flex items-center ${currentStep === 'draft-order' ? 'text-blue-500' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'draft-order' ? 'bg-blue-500 text-white' : 'bg-gray-700'
            }`}>3</div>
            <span className="ml-2">Draft Order</span>
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 'basic' && (
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">League Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="League Name Here"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
              <p className="text-sm text-gray-400 mt-2">You can add races to your league later</p>
            </div>

            <button
              onClick={() => setCurrentStep('teams')}
              disabled={!canProceedFromBasic}
              className={`w-full py-3 rounded font-bold ${
                canProceedFromBasic ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              Next: Set Up Teams
            </button>
          </div>
        )}

        {/* Step 2: Teams */}
        {currentStep === 'teams' && (
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Team Setup</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {formData.teams.length} teams × {formData.drivers_per_team} drivers = {formData.teams.length * formData.drivers_per_team} total picks
                </p>
              </div>
              <button
                onClick={addTeam}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                + Add Team
              </button>
            </div>

            {formData.teams.map((team, index) => (
              <div key={index} className="p-4 bg-gray-700 rounded">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Team {index + 1}</h3>
                  {formData.teams.length > 2 && (
                    <button
                      onClick={() => removeTeam(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2">Team Name</label>
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => updateTeam(index, { name: e.target.value })}
                      placeholder={`Player ${index + 1}`}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Team Color</label>
                    <ColorPicker
                      value={team.color}
                      onChange={(color) => updateTeam(index, { color })}
                      usedColors={usedColors.filter((_, i) => i !== index)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep('basic')}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep('draft-order')}
                disabled={!canProceedFromTeams}
                className={`flex-1 py-3 rounded font-bold ${
                  canProceedFromTeams ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Next: Draft Order
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Draft Order */}
        {currentStep === 'draft-order' && (
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-bold">Draft Order</h2>

            <div className="space-y-3">
              <label className="flex items-center p-4 bg-gray-700 rounded cursor-pointer hover:bg-gray-600">
                <input
                  type="radio"
                  name="draftOrder"
                  checked={formData.draft_order === 'random'}
                  onChange={() => updateFormData({ draft_order: 'random' })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Random Order</div>
                  <div className="text-sm text-gray-400">Teams will be randomly assigned draft positions</div>
                </div>
              </label>

              <label className="flex items-center p-4 bg-gray-700 rounded cursor-pointer hover:bg-gray-600">
                <input
                  type="radio"
                  name="draftOrder"
                  checked={formData.draft_order === 'manual'}
                  onChange={() => updateFormData({ draft_order: 'manual' })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Manual Order</div>
                  <div className="text-sm text-gray-400">Draft order is: {formData.teams.map((t, i) => t.name || `Team ${i+1}`).join(' → ')}</div>
                </div>
              </label>
            </div>

            <div className="bg-blue-900 border border-blue-700 p-4 rounded">
              <h3 className="font-medium mb-2">📋 What happens next?</h3>
              <ol className="text-sm text-gray-300 space-y-1">
                <li>1. You'll get a share link to send to players</li>
                <li>2. Everyone joins the waiting room</li>
                <li>3. When all ready, start the snake draft</li>
                <li>4. Score points during the race!</li>
              </ol>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep('teams')}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded font-bold"
              >
                {loading ? 'Creating...' : 'Create League'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { upgradeToVerifiedAccount } from '@/lib/auth/upgrade';
import { Modal } from '@/components/shared/Modal';

interface UpgradePromptProps {
  playerId: string;
  leagueId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradePrompt({ playerId, leagueId, isOpen, onClose }: UpgradePromptProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await upgradeToVerifiedAccount(playerId, email);
      setSent(true);
    } catch (error) {
      console.error('Failed to upgrade:', error);
      alert('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Your Progress?">
      <div className="space-y-4">
        {!sent ? (
          <>
            <p className="text-gray-300">
              This is a season league! Sign in to access your team from any device and track your standings across races.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={handleUpgrade}
              disabled={!email || loading}
              className={`
                w-full py-2 rounded font-bold
                ${!email || loading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-gray-400 text-sm hover:text-white"
            >
              Skip (stay anonymous)
            </button>
          </>
        ) : (
          <>
            <div className="bg-green-900 text-green-200 p-4 rounded-lg">
              <div className="font-bold mb-2">✓ Check your email!</div>
              <p className="text-sm">
                We sent a magic link to <strong>{email}</strong>. 
                Click the link to complete sign-in.
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JoinLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinLeagueModal({ isOpen, onClose }: JoinLeagueModalProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setError('Please enter a league code');
      return;
    }

    if (trimmedCode.length !== 6) {
      setError('League code must be 6 characters');
      return;
    }

    setLoading(true);
    router.push(`/join/${trimmedCode}`);
  };

  const handleClose = () => {
    setCode('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#1e1e1e] rounded-lg p-8 max-w-md w-full border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#D2B83E] to-[#B42518] bg-clip-text text-transparent">
            Join League
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="code" className="block text-sm text-gray-400 mb-2">
              League Share Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D2B83E] transition-colors uppercase tracking-wider text-center text-xl font-bold"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded-lg transition-all font-medium border border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D2B83E] to-[#B42518] hover:from-[#E5C94F] hover:to-[#C53829] text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join League'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

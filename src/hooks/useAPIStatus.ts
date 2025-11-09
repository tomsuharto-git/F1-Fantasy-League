'use client';

import { useState, useEffect } from 'react';
import type { APIStatus } from '@/lib/types';

/**
 * Hook for tracking API connection status
 */
export function useAPIStatus() {
  const [status, setStatus] = useState<APIStatus>({
    lastUpdate: null,
    isConnected: true,
    updateCount: 0,
    errorCount: 0
  });

  const recordSuccess = () => {
    setStatus(prev => ({
      lastUpdate: new Date(),
      isConnected: true,
      updateCount: prev.updateCount + 1,
      errorCount: 0
    }));
  };

  const recordError = () => {
    setStatus(prev => ({
      ...prev,
      isConnected: prev.errorCount >= 2 ? false : prev.isConnected,
      errorCount: prev.errorCount + 1
    }));
  };

  const getStatusColor = (): 'green' | 'yellow' | 'red' => {
    if (!status.lastUpdate || !status.isConnected) return 'red';
    
    const secondsAgo = (Date.now() - status.lastUpdate.getTime()) / 1000;
    
    if (secondsAgo < 30) return 'green';
    if (secondsAgo < 120) return 'yellow';
    return 'red';
  };

  const getStatusText = (): string => {
    if (!status.lastUpdate || !status.isConnected) return 'Disconnected';
    
    const secondsAgo = Math.floor((Date.now() - status.lastUpdate.getTime()) / 1000);
    
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    return `${minutesAgo}m ago`;
  };

  return {
    status,
    recordSuccess,
    recordError,
    statusColor: getStatusColor(),
    statusText: getStatusText()
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { openF1Live } from '@/lib/api/openf1-live';
import type { LiveConnectionStatus } from '@/lib/types';

/**
 * React hook for OpenF1 live race data via WebSocket/MQTT
 *
 * @param sessionKey - OpenF1 session key for the race
 * @param autoConnect - Whether to connect automatically on mount (default: true)
 *
 * @returns Live race data and connection controls
 */
export function useOpenF1Live(sessionKey: number | null, autoConnect: boolean = true) {
  const [positions, setPositions] = useState<Map<number, number>>(new Map());
  const [fastestLap, setFastestLap] = useState<number | null>(null);
  const [currentLap, setCurrentLap] = useState<number>(0);
  const [status, setStatus] = useState<LiveConnectionStatus>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update state from live service
   */
  const updateData = useCallback(() => {
    setPositions(openF1Live.getPositions());
    setFastestLap(openF1Live.getFastestLap());
    setCurrentLap(openF1Live.getCurrentLap());
    setLastUpdate(new Date());
  }, []);

  /**
   * Connect to live stream
   */
  const connect = useCallback(async () => {
    if (!sessionKey) {
      setError('No session key provided');
      return;
    }

    try {
      setError(null);
      await openF1Live.connect(sessionKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      console.error('[useOpenF1Live] Connection error:', err);
    }
  }, [sessionKey]);

  /**
   * Disconnect from live stream
   */
  const disconnect = useCallback(() => {
    openF1Live.disconnect();
  }, []);

  /**
   * Reconnect (fetch new token and reconnect)
   */
  const reconnect = useCallback(async () => {
    if (!sessionKey) {
      setError('No session key provided');
      return;
    }

    try {
      setError(null);
      await openF1Live.reconnect(sessionKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconnection failed');
      console.error('[useOpenF1Live] Reconnection error:', err);
    }
  }, [sessionKey]);

  /**
   * Manual refresh (get latest data)
   */
  const refresh = useCallback(() => {
    updateData();
  }, [updateData]);

  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = openF1Live.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Initialize status
    setStatus(openF1Live.getStatus());

    return unsubscribe;
  }, []);

  // Subscribe to live data updates
  useEffect(() => {
    // Listen to all topics
    const unsubscribe = openF1Live.on('*', () => {
      updateData();
    });

    return unsubscribe;
  }, [updateData]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && sessionKey && status === 'disconnected') {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, sessionKey, status, connect, disconnect]);

  return {
    // Data
    positions,
    fastestLap,
    currentLap,
    lastUpdate,

    // Status
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    isError: status === 'error',
    error,

    // Controls
    connect,
    disconnect,
    reconnect,
    refresh,
  };
}

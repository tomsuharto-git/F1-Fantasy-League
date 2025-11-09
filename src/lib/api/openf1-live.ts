'use client';

import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
import type {
  OpenF1Position,
  OpenF1Lap,
  LiveConnectionStatus,
  OpenF1TokenResponse
} from '../types';

/**
 * OpenF1 Live Data Service
 *
 * Connects to OpenF1 MQTT/WebSocket for real-time race data
 * Handles authentication, subscriptions, and reconnection
 */
class OpenF1LiveService {
  private client: MqttClient | null = null;
  private accessToken: string | null = null;
  private websocketUrl = 'wss://mqtt.openf1.org:8084/mqtt';
  private status: LiveConnectionStatus = 'disconnected';

  // Event listeners
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private statusListeners: Set<(status: LiveConnectionStatus) => void> = new Set();

  // Data storage
  private latestPositions: Map<number, OpenF1Position> = new Map();
  private laps: OpenF1Lap[] = [];

  /**
   * Fetch access token from backend
   */
  async fetchToken(): Promise<string> {
    try {
      const response = await fetch('/api/openf1/token');

      if (!response.ok) {
        throw new Error(`Token fetch failed: ${response.status}`);
      }

      const data: OpenF1TokenResponse = await response.json();
      this.accessToken = data.access_token;

      console.log('[OpenF1Live] Token fetched successfully', {
        cached: data.cached,
        expiresIn: data.expires_in
      });

      return data.access_token;
    } catch (error) {
      console.error('[OpenF1Live] Failed to fetch token:', error);
      throw error;
    }
  }

  /**
   * Connect to OpenF1 MQTT WebSocket
   */
  async connect(sessionKey?: number): Promise<void> {
    try {
      this.setStatus('connecting');

      // Fetch token if we don't have one
      if (!this.accessToken) {
        await this.fetchToken();
      }

      // Connect to MQTT over WebSocket
      this.client = mqtt.connect(this.websocketUrl, {
        username: 'openf1_client', // Can be any non-empty string
        password: this.accessToken!,
        reconnectPeriod: 5000, // Auto-reconnect every 5s
        connectTimeout: 10000,
        clientId: `f1-fantasy-${Math.random().toString(16).slice(2, 10)}`,
      });

      // Event handlers
      this.client.on('connect', () => {
        console.log('[OpenF1Live] Connected to MQTT broker');
        this.setStatus('connected');

        // Subscribe to topics
        this.subscribeToTopics(sessionKey);
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (error) => {
        console.error('[OpenF1Live] MQTT error:', error);
        this.setStatus('error');
      });

      this.client.on('close', () => {
        console.log('[OpenF1Live] Connection closed');
        this.setStatus('disconnected');
      });

      this.client.on('offline', () => {
        console.log('[OpenF1Live] Client offline');
        this.setStatus('disconnected');
      });

      this.client.on('reconnect', () => {
        console.log('[OpenF1Live] Attempting to reconnect...');
        this.setStatus('connecting');
      });

    } catch (error) {
      console.error('[OpenF1Live] Connection failed:', error);
      this.setStatus('error');
      throw error;
    }
  }

  /**
   * Subscribe to relevant topics
   */
  private subscribeToTopics(sessionKey?: number): void {
    if (!this.client) return;

    const topics = [
      'v1/position',
      'v1/laps',
      // Optionally subscribe to more topics:
      // 'v1/car_data',
      // 'v1/pit',
      // 'v1/team_radio',
    ];

    topics.forEach(topic => {
      this.client!.subscribe(topic, (err) => {
        if (err) {
          console.error(`[OpenF1Live] Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`[OpenF1Live] Subscribed to ${topic}`);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private handleMessage(topic: string, messageBuffer: Buffer): void {
    try {
      const message = JSON.parse(messageBuffer.toString());

      // Route message to appropriate handler
      if (topic === 'v1/position') {
        this.handlePosition(message);
      } else if (topic === 'v1/laps') {
        this.handleLap(message);
      }

      // Emit to topic listeners
      const topicListeners = this.listeners.get(topic);
      if (topicListeners) {
        topicListeners.forEach(callback => callback(message));
      }

      // Emit to wildcard listeners
      const allListeners = this.listeners.get('*');
      if (allListeners) {
        allListeners.forEach(callback => callback({ topic, data: message }));
      }

    } catch (error) {
      console.error('[OpenF1Live] Failed to parse message:', error);
    }
  }

  /**
   * Handle position updates
   */
  private handlePosition(position: OpenF1Position): void {
    // Store latest position for each driver
    this.latestPositions.set(position.driver_number, position);
  }

  /**
   * Handle lap updates
   */
  private handleLap(lap: OpenF1Lap): void {
    // Check if this is an update to an existing lap
    const existingIndex = this.laps.findIndex(
      l => l._key && l._key === lap._key
    );

    if (existingIndex >= 0) {
      // Update existing lap
      this.laps[existingIndex] = lap;
    } else {
      // Add new lap
      this.laps.push(lap);

      // Keep only recent laps (last 100)
      if (this.laps.length > 100) {
        this.laps = this.laps.slice(-100);
      }
    }
  }

  /**
   * Subscribe to a specific topic
   */
  on(topic: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }

    this.listeners.get(topic)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(topic)?.delete(callback);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: (status: LiveConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Set connection status and notify listeners
   */
  private setStatus(status: LiveConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach(callback => callback(status));
  }

  /**
   * Get current connection status
   */
  getStatus(): LiveConnectionStatus {
    return this.status;
  }

  /**
   * Get latest positions
   */
  getPositions(): Map<number, number> {
    const positionMap = new Map<number, number>();

    this.latestPositions.forEach((pos, driverNumber) => {
      positionMap.set(driverNumber, pos.position);
    });

    return positionMap;
  }

  /**
   * Get fastest lap
   */
  getFastestLap(): number | null {
    const racingLaps = this.laps.filter(lap => !lap.is_pit_out_lap);

    if (racingLaps.length === 0) return null;

    const fastest = racingLaps.reduce((min, lap) => {
      return !min || lap.lap_duration < min.lap_duration ? lap : min;
    }, null as OpenF1Lap | null);

    return fastest?.driver_number || null;
  }

  /**
   * Get current lap number
   */
  getCurrentLap(): number {
    if (this.laps.length === 0) return 0;
    return Math.max(...this.laps.map(lap => lap.lap_number));
  }

  /**
   * Disconnect from MQTT
   */
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }

    this.setStatus('disconnected');
    this.latestPositions.clear();
    this.laps = [];
  }

  /**
   * Reconnect (fetch new token and reconnect)
   */
  async reconnect(sessionKey?: number): Promise<void> {
    this.disconnect();
    this.accessToken = null;
    await this.connect(sessionKey);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }
}

// Singleton instance
export const openF1Live = new OpenF1LiveService();

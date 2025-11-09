// OpenF1 API Client
import type { OpenF1Position, OpenF1Lap, OpenF1Session } from '../types';

class OpenF1Service {
  private baseUrl = process.env.NEXT_PUBLIC_OPENF1_API_URL || 'https://api.openf1.org/v1';
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Get session key for a specific race
   */
  async getSessionKey(year: number, countryName: string): Promise<number | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/sessions?country_name=${countryName}&year=${year}&session_name=Race`
      );
      const sessions: OpenF1Session[] = await response.json();
      return sessions[0]?.session_key || null;
    } catch (error) {
      console.error('OpenF1: Failed to get session key', error);
      return null;
    }
  }

  /**
   * Get latest position for each driver
   */
  async getLivePositions(sessionKey: number): Promise<Map<number, number>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/position?session_key=${sessionKey}`
      );
      const positions: OpenF1Position[] = await response.json();
      
      // Group by driver, get most recent position
      const positionMap = new Map<number, number>();
      
      positions.forEach(pos => {
        const current = positionMap.get(pos.driver_number);
        const currentDate = current ? new Date(positions.find(p => p.driver_number === pos.driver_number && positionMap.get(p.driver_number) === current)!.date) : null;
        if (!currentDate || new Date(pos.date) > currentDate) {
          positionMap.set(pos.driver_number, pos.position);
        }
      });
      
      return positionMap;
    } catch (error) {
      console.error('OpenF1: Failed to get positions', error);
      return new Map();
    }
  }

  /**
   * Get driver with fastest lap
   */
  async getFastestLap(sessionKey: number): Promise<number | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/laps?session_key=${sessionKey}`
      );
      const laps: OpenF1Lap[] = await response.json();
      
      // Filter out pit out laps, find minimum duration
      const racingLaps = laps.filter(lap => !lap.is_pit_out_lap);
      const fastest = racingLaps.reduce((min, lap) => {
        return !min || lap.lap_duration < min.lap_duration ? lap : min;
      }, null as OpenF1Lap | null);
      
      return fastest?.driver_number || null;
    } catch (error) {
      console.error('OpenF1: Failed to get fastest lap', error);
      return null;
    }
  }

  /**
   * Get current lap number
   */
  async getCurrentLap(sessionKey: number): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/laps?session_key=${sessionKey}`
      );
      const laps: OpenF1Lap[] = await response.json();
      
      const currentLap = Math.max(...laps.map(lap => lap.lap_number));
      return currentLap || 0;
    } catch (error) {
      console.error('OpenF1: Failed to get current lap', error);
      return 0;
    }
  }

  /**
   * Start auto-update loop
   */
  startAutoUpdate(
    sessionKey: number,
    onUpdate: (
      positions: Map<number, number>,
      fastestLap: number | null,
      currentLap: number
    ) => void,
    intervalMs: number = 30000
  ) {
    this.stopAutoUpdate();

    // Fetch immediately
    this.fetchAndUpdate(sessionKey, onUpdate);

    // Then set interval
    this.updateInterval = setInterval(() => {
      this.fetchAndUpdate(sessionKey, onUpdate);
    }, intervalMs);
  }

  private async fetchAndUpdate(
    sessionKey: number,
    onUpdate: (
      positions: Map<number, number>,
      fastestLap: number | null,
      currentLap: number
    ) => void
  ) {
    try {
      const [positions, fastestLap, currentLap] = await Promise.all([
        this.getLivePositions(sessionKey),
        this.getFastestLap(sessionKey),
        this.getCurrentLap(sessionKey)
      ]);
      
      onUpdate(positions, fastestLap, currentLap);
    } catch (error) {
      console.error('OpenF1: Update failed', error);
    }
  }

  /**
   * Stop auto-update loop
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Check if race has started
   */
  async isRaceStarted(sessionKey: number): Promise<boolean> {
    const positions = await this.getLivePositions(sessionKey);
    return positions.size > 0;
  }

  /**
   * Manual refresh (for button click)
   */
  async manualRefresh(sessionKey: number) {
    return {
      positions: await this.getLivePositions(sessionKey),
      fastestLap: await this.getFastestLap(sessionKey),
      currentLap: await this.getCurrentLap(sessionKey)
    };
  }
}

export const openF1 = new OpenF1Service();

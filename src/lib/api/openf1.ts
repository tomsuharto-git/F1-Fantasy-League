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

  /**
   * Get latest session (for draft grid)
   */
  async getLatestSession(): Promise<OpenF1Session | null> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions?session_key=latest`);
      const sessions: OpenF1Session[] = await response.json();
      return sessions[0] || null;
    } catch (error) {
      console.error('OpenF1: Failed to get latest session', error);
      return null;
    }
  }

  /**
   * Get drivers from latest session with starting positions (from qualifying)
   */
  async getLatestDriverGrid() {
    try {
      // First get the latest race session
      const sessionRes = await fetch(`${this.baseUrl}/sessions?session_key=latest`);
      const sessions = await sessionRes.json();

      if (!sessions || sessions.length === 0) {
        throw new Error('No active session found');
      }

      const raceSession = sessions[0];
      const meetingKey = raceSession.meeting_key;

      // Find the qualifying session for this meeting
      const qualifyingRes = await fetch(
        `${this.baseUrl}/sessions?meeting_key=${meetingKey}&session_name=Qualifying`
      );
      const qualifyingSessions = await qualifyingRes.json();

      if (!qualifyingSessions || qualifyingSessions.length === 0) {
        throw new Error('No qualifying session found');
      }

      const qualifyingSessionKey = qualifyingSessions[0].session_key;

      // Fetch positions from qualifying and driver info from race
      const [positionsRes, driversRes] = await Promise.all([
        fetch(`${this.baseUrl}/position?session_key=${qualifyingSessionKey}`),
        fetch(`${this.baseUrl}/drivers?session_key=latest`)
      ]);

      const positions: OpenF1Position[] = await positionsRes.json();
      const driversData = await driversRes.json();

      // Get the final qualifying position for each driver (latest timestamp)
      const driverMap = new Map<number, OpenF1Position>();

      positions.forEach(pos => {
        const existing = driverMap.get(pos.driver_number);
        if (!existing || new Date(pos.date) > new Date(existing.date)) {
          driverMap.set(pos.driver_number, pos);
        }
      });

      // Combine position data with driver names from API
      const gridWithNames = Array.from(driverMap.values()).map(pos => {
        const driverInfo = driversData.find((d: any) => d.driver_number === pos.driver_number);
        return {
          ...pos,
          full_name: driverInfo?.full_name || null,
          name_acronym: driverInfo?.name_acronym || null,
          team_name: driverInfo?.team_name || null
        };
      });

      // Sort by position
      return gridWithNames.sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error('OpenF1: Failed to get driver grid', error);
      return [];
    }
  }

  /**
   * Get starting grid for draft - returns Driver[] with tiers assigned
   * Tiers: P1-P5 = Tier 1, P6-P10 = Tier 2, P11-P15 = Tier 3, P16-P20 = Tier 4
   */
  async getStartingGrid(): Promise<{
    drivers: Array<{
      id: string;
      code: string;
      name: string;
      number: number;
      team: string;
      startPosition: number;
      tier: number;
    }>;
    raceInfo: {
      raceName: string;
      circuitName: string;
      country: string;
      raceStart: string | null;
      meetingKey: number;
    } | null;
  }> {
    try {
      console.log('[OpenF1] Fetching starting grid...');
      // Get latest session info
      const sessionRes = await fetch(`${this.baseUrl}/sessions?session_key=latest`);
      const sessions = await sessionRes.json();
      console.log('[OpenF1] Sessions:', sessions?.length || 0);

      if (!sessions || sessions.length === 0) {
        throw new Error('No active session found');
      }

      const latestSession = sessions[0];
      const meetingKey = latestSession.meeting_key;

      // Get meeting info for race name, qualifying session, and race session in parallel
      const [meetingRes, qualifyingRes, raceSessionRes] = await Promise.all([
        fetch(`${this.baseUrl}/meetings?meeting_key=${meetingKey}`),
        fetch(`${this.baseUrl}/sessions?meeting_key=${meetingKey}&session_name=Qualifying`),
        fetch(`${this.baseUrl}/sessions?meeting_key=${meetingKey}&session_name=Race`)
      ]);

      const meetings = await meetingRes.json();
      const qualifyingSessions = await qualifyingRes.json();
      const raceSessions = await raceSessionRes.json();

      if (!qualifyingSessions || qualifyingSessions.length === 0) {
        throw new Error('No qualifying session found');
      }

      const meeting = meetings[0];
      const qualifyingSessionKey = qualifyingSessions[0].session_key;
      const raceStart = raceSessions?.[0]?.date_start || null;

      // Fetch qualifying positions and driver info in parallel
      const [positionsRes, driversRes] = await Promise.all([
        fetch(`${this.baseUrl}/position?session_key=${qualifyingSessionKey}`),
        fetch(`${this.baseUrl}/drivers?session_key=${qualifyingSessionKey}`)
      ]);

      const positions: OpenF1Position[] = await positionsRes.json();
      const driversData = await driversRes.json();
      console.log('[OpenF1] Drivers:', driversData?.length || 0, 'Positions:', positions?.length || 0);

      // Get final qualifying position for each driver (latest timestamp)
      const driverPositions = new Map<number, number>();
      positions.forEach(pos => {
        const existing = driverPositions.get(pos.driver_number);
        const existingDate = positions.find(
          p => p.driver_number === pos.driver_number && driverPositions.get(p.driver_number) === existing
        )?.date;
        if (!existing || new Date(pos.date) > new Date(existingDate || 0)) {
          driverPositions.set(pos.driver_number, pos.position);
        }
      });

      // Build driver array with tiers
      const drivers = driversData.map((d: any) => {
        const startPosition = driverPositions.get(d.driver_number) || 20;
        return {
          id: d.name_acronym,
          code: d.name_acronym,
          name: `${d.first_name} ${d.last_name}`,
          number: d.driver_number,
          team: d.team_name,
          startPosition,
          tier: this.positionToTier(startPosition),
          headshotUrl: d.headshot_url || null
        };
      });

      // Sort by starting position
      drivers.sort((a: any, b: any) => a.startPosition - b.startPosition);

      return {
        drivers,
        raceInfo: {
          raceName: meeting?.meeting_name || 'Grand Prix',
          circuitName: meeting?.circuit_short_name || latestSession.location,
          country: meeting?.country_name || latestSession.country_name,
          raceStart,
          meetingKey
        }
      };
    } catch (error) {
      console.error('OpenF1: Failed to get starting grid', error);
      return { drivers: [], raceInfo: null };
    }
  }

  /**
   * Convert grid position to tier (1-4)
   */
  private positionToTier(position: number): number {
    if (position <= 5) return 1;
    if (position <= 10) return 2;
    if (position <= 15) return 3;
    return 4;
  }
}

export const openF1 = new OpenF1Service();

// Ergast API Client
import type { ErgastRace, ErgastGridPosition, Driver } from '../types';

class ErgastService {
  private baseUrl = process.env.NEXT_PUBLIC_ERGAST_API_URL || 'https://ergast.com/api/f1';

  /**
   * Get current season calendar
   */
  async getSeasonCalendar(year: number = 2025): Promise<ErgastRace[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${year}.json`);
      const data = await response.json();
      return data.MRData.RaceTable.Races || [];
    } catch (error) {
      console.error('Ergast: Failed to get calendar', error);
      return [];
    }
  }

  /**
   * Get starting grid for a race
   */
  async getStartingGrid(year: number, round: number): Promise<ErgastGridPosition[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${year}/${round}/grid.json`);
      const data = await response.json();
      return data.MRData.RaceTable.Races[0]?.QualifyingResults || [];
    } catch (error) {
      console.error('Ergast: Failed to get grid', error);
      return [];
    }
  }

  /**
   * Get all current drivers
   */
  async getCurrentDrivers(year: number = 2025) {
    try {
      const response = await fetch(`${this.baseUrl}/${year}/drivers.json`);
      const data = await response.json();
      return data.MRData.DriverTable.Drivers || [];
    } catch (error) {
      console.error('Ergast: Failed to get drivers', error);
      return [];
    }
  }

  /**
   * Get race results (for post-race validation)
   */
  async getRaceResults(year: number, round: number) {
    try {
      const response = await fetch(`${this.baseUrl}/${year}/${round}/results.json`);
      const data = await response.json();
      return data.MRData.RaceTable.Races[0]?.Results || [];
    } catch (error) {
      console.error('Ergast: Failed to get results', error);
      return [];
    }
  }

  /**
   * Convert Ergast grid to app format
   */
  formatGridForDraft(grid: ErgastGridPosition[]): Driver[] {
    return grid.map((pos) => ({
      id: pos.Driver.code,
      code: pos.Driver.code,
      name: `${pos.Driver.givenName} ${pos.Driver.familyName}`,
      number: parseInt(pos.Driver.permanentNumber),
      team: pos.Constructor.name,
      startPosition: parseInt(pos.position),
      tier: this.getTier(parseInt(pos.position))
    }));
  }

  private getTier(position: number): number {
    if (position <= 5) return 1;
    if (position <= 10) return 2;
    if (position <= 15) return 3;
    return 4;
  }
}

export const ergast = new ErgastService();

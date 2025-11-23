// 2025 F1 Driver Grid
// Maps driver numbers to names, codes, and teams

export interface DriverInfo {
  number: number;
  code: string;
  name: string;
  team: string;
}

export const DRIVER_2025: Record<number, DriverInfo> = {
  1: { number: 1, code: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing' },
  4: { number: 4, code: 'NOR', name: 'Lando Norris', team: 'McLaren' },
  5: { number: 5, code: 'BOR', name: 'Gabriel Bortoleto', team: 'Kick Sauber' },
  7: { number: 7, code: 'ANT', name: 'Kimi Antonelli', team: 'Mercedes' },
  10: { number: 10, code: 'GAS', name: 'Pierre Gasly', team: 'Alpine' },
  12: { number: 12, code: 'ANT', name: 'Andrea Kimi Antonelli', team: 'Mercedes' },
  14: { number: 14, code: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin' },
  16: { number: 16, code: 'LEC', name: 'Charles Leclerc', team: 'Ferrari' },
  18: { number: 18, code: 'STR', name: 'Lance Stroll', team: 'Aston Martin' },
  21: { number: 21, code: 'HAD', name: 'Isack Hadjar', team: 'Racing Bulls' },
  22: { number: 22, code: 'TSU', name: 'Yuki Tsunoda', team: 'Racing Bulls' },
  23: { number: 23, code: 'ALB', name: 'Alex Albon', team: 'Williams' },
  27: { number: 27, code: 'HUL', name: 'Nico Hulkenberg', team: 'Kick Sauber' },
  30: { number: 30, code: 'LAW', name: 'Liam Lawson', team: 'Red Bull Racing' },
  31: { number: 31, code: 'OCO', name: 'Esteban Ocon', team: 'Haas' },
  43: { number: 43, code: 'COL', name: 'Andrea Kola Calderelli', team: 'Alpine' },
  44: { number: 44, code: 'HAM', name: 'Lewis Hamilton', team: 'Ferrari' },
  55: { number: 55, code: 'SAI', name: 'Carlos Sainz', team: 'Williams' },
  63: { number: 63, code: 'RUS', name: 'George Russell', team: 'Mercedes' },
  81: { number: 81, code: 'PIA', name: 'Oscar Piastri', team: 'McLaren' },
  87: { number: 87, code: 'BEA', name: 'Oliver Bearman', team: 'Haas' },
};

/**
 * Get driver info by number
 */
export function getDriverInfo(number: number): DriverInfo | null {
  return DRIVER_2025[number] || null;
}

/**
 * Get all drivers as array
 */
export function getAllDrivers(): DriverInfo[] {
  return Object.values(DRIVER_2025);
}

// Core Types for F1 Fantasy League

export type LeagueType = 'race_day' | 'season_league';
export type LeagueStatus = 'setup' | 'active' | 'complete';
export type RaceStatus = 'upcoming' | 'drafting' | 'live' | 'complete';
export type DataSource = 'api' | 'manual';

// ============================================================================
// LEAGUE
// ============================================================================

export interface League {
  id: string;
  name: string;
  share_code: string;
  type: LeagueType;
  created_by: string | null;
  max_races: number;
  drivers_per_team: number;
  status: LeagueStatus;
  created_at: string;
  updated_at: string;
  players?: Player[];
  races?: Race[];
}

export interface CreateLeagueInput {
  name: string;
  type: LeagueType;
  max_races: number;
  drivers_per_team: number;
  teams: Array<{ name: string; color: string }>;
  draft_order: 'random' | 'manual';
}

// ============================================================================
// PLAYER
// ============================================================================

export interface Player {
  id: string;
  league_id: string;
  user_id: string | null;
  display_name: string;
  color: string;
  draft_position: number | null;
  is_ready: boolean;
  is_verified: boolean;
  device_fingerprint?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalPlayer {
  id: string;
  displayName: string;
  color: string;
  leagueId: string;
  verified?: boolean;
}

// ============================================================================
// RACE
// ============================================================================

export interface Race {
  id: string;
  league_id: string;
  race_number: number;
  race_name: string;
  circuit: string | null;
  country: string | null;
  date: string | null;
  session_key: number | null;
  status: RaceStatus;
  draft_complete: boolean;
  results_finalized: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DRIVER
// ============================================================================

export interface Driver {
  id: string;
  code: string;
  name: string;
  number: number;
  team: string;
  startPosition: number;
  tier?: number;
}

export interface DriverPosition {
  driverId: string;
  driverNumber: number;
  position: number;
  source: DataSource;
  lastUpdated: Date;
  previousSource?: DataSource;
}

export interface DriverScore {
  score: number;
  finishPos: number | 'DNF';
  movement: number | string;
  movementPoints: number;
  bonus: number;
  fastestLapPoints: number;
  isDNF: boolean;
}

export interface DriverResult {
  driver_code: string;
  start_position: number;
  finish_position: number;
  movement_points: number;
  position_bonus: number;
  fastest_lap_bonus: number;
  total_points: number;
  data_source: DataSource;
}

// ============================================================================
// DRAFT
// ============================================================================

export interface DraftPick {
  id: string;
  race_id: string;
  player_id: string;
  driver_code: string;
  driver_name: string;
  driver_number: number | null;
  team: string | null;
  start_position: number | null;
  pick_number: number;
  created_at: string;
}

export interface DraftState {
  currentPickIndex: number;
  timeRemaining: number;
  picks: DraftPick[];
  availableDrivers: Driver[];
  isPaused: boolean;
}

// ============================================================================
// RACE RESULTS
// ============================================================================

export interface RaceResult {
  id: string;
  race_id: string;
  player_id: string;
  total_points: number;
  fastest_lap_driver: string | null;
  driver_results: DriverResult[];
  finalized_at: string;
}

// ============================================================================
// SEASON STANDINGS
// ============================================================================

export interface SeasonStanding {
  league_id: string;
  player_id: string;
  player_name: string;
  color: string;
  total_points: number;
  races_completed: number;
  race_breakdown: Array<{
    race_id: string;
    race_name: string;
    race_number: number;
    points: number;
  }>;
}

// ============================================================================
// API TYPES
// ============================================================================

// OpenF1 API
export interface OpenF1Position {
  date: string;
  driver_number: number;
  position: number;
}

export interface OpenF1Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number;
  is_pit_out_lap: boolean;
  _key?: string;
}

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  location: string;
  country_name: string;
}

export interface OpenF1TokenResponse {
  access_token: string;
  cached?: boolean;
  expires_in?: number;
}

// Ergast API
export interface ErgastRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitName: string;
    Location: {
      country: string;
    };
  };
  date: string;
  time?: string;
}

export interface ErgastGridPosition {
  position: string;
  Driver: {
    driverId: string;
    code: string;
    givenName: string;
    familyName: string;
    permanentNumber: string;
  };
  Constructor: {
    name: string;
  };
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type LiveConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface APIStatus {
  lastUpdate: Date | null;
  isConnected: boolean;
  updateCount: number;
  errorCount: number;
}

export interface NotificationType {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================================================
// TEAM COLORS
// ============================================================================

export const TEAM_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
  '#607D8B'  // Blue Grey
] as const;

// ============================================================================
// DRIVER NUMBER MAPPING (2025 Season)
// ============================================================================

export const DRIVER_NUMBERS: Record<number, string> = {
  1: 'VER',   // Max Verstappen
  4: 'NOR',   // Lando Norris
  5: 'BOR',   // Gabriel Bortoleto
  12: 'ANT',  // Kimi Antonelli
  14: 'ALO',  // Fernando Alonso
  16: 'LEC',  // Charles Leclerc
  18: 'STR',  // Lance Stroll
  21: 'HAD',  // Isack Hadjar
  23: 'ALB',  // Alex Albon
  30: 'LAW',  // Liam Lawson
  31: 'OCO',  // Esteban Ocon
  44: 'HAM',  // Lewis Hamilton
  55: 'SAI',  // Carlos Sainz
  81: 'PIA',  // Oscar Piastri
  87: 'BEA',  // Oliver Bearman
};

export const CODE_TO_NUMBER = Object.entries(DRIVER_NUMBERS).reduce(
  (acc, [num, code]) => ({ ...acc, [code]: parseInt(num) }),
  {} as Record<string, number>
);

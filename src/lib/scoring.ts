// Scoring Calculation Logic
import type { Driver, DriverScore } from './types';

/**
 * Calculate points for a single driver
 */
export function calculateDriverScore(
  driver: Driver,
  finishPosition: number,
  hasFastestLap: boolean
): DriverScore {
  const movement = driver.startPosition - finishPosition;
  let movementPoints: number;
  
  // DNF handling (position 21)
  if (finishPosition >= 21) {
    movementPoints = -8; // Capped at -8
  } else {
    // Position gains: +2 per position
    // Position losses: -1 per position
    movementPoints = movement > 0 ? movement * 2 : movement * 1;
  }
  
  // Position bonuses
  let bonus = 0;
  if (finishPosition === 1) bonus = 8;
  else if (finishPosition === 2) bonus = 4;
  else if (finishPosition === 3) bonus = 2;
  else if (finishPosition === 4) bonus = 1;
  
  // Fastest lap (only if P10 or better)
  const fastestLapPoints = (hasFastestLap && finishPosition <= 10) ? 3 : 0;
  
  return {
    score: movementPoints + bonus + fastestLapPoints,
    finishPos: finishPosition >= 21 ? 'DNF' : finishPosition,
    movement: finishPosition >= 21 ? `DNF from P${driver.startPosition}` : movement,
    movementPoints,
    bonus,
    fastestLapPoints,
    isDNF: finishPosition >= 21
  };
}

/**
 * Calculate total points for a team
 */
export function calculateTeamTotal(
  drivers: Driver[],
  positions: Map<string, number>,
  fastestLapDriver: string | null
): number {
  return drivers.reduce((total, driver) => {
    const finishPos = positions.get(driver.id) || driver.startPosition;
    const hasFastestLap = fastestLapDriver === driver.id;
    const score = calculateDriverScore(driver, finishPos, hasFastestLap);
    return total + score.score;
  }, 0);
}

/**
 * Get driver code from number
 */
export function getDriverCodeFromNumber(num: number, mapping: Record<number, string>): string {
  return mapping[num] || `UNKNOWN_${num}`;
}

/**
 * Get driver number from code
 */
export function getDriverNumberFromCode(code: string, mapping: Record<string, number>): number {
  return mapping[code] || 0;
}

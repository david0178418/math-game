/**
 * Shared Type Definitions
 * Common types used across multiple systems and components
 */

// Grid position type
export interface GridPosition {
  readonly x: number;
  readonly y: number;
}



// AI behavior types from config
export type AIBehavior = 'chase' | 'patrol' | 'random' | 'guard';

// Enemy types from config
export type EnemyType = 'lizard' | 'spider' | 'frog';

// Math operation types
export type MathOperation = '+' | '-' | '*' | '/';

// Difficulty levels
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

// UI style variants
export type ButtonStyle = 'success' | 'primary' | 'warning' | 'danger' | 'secondary';
export type ButtonSize = 'large' | 'medium';
export type HUDColorType = 'success' | 'danger' | 'info' | 'purple' | 'gray';


// Performance monitoring types
export interface PerformanceStats {
  readonly fps: number;
  readonly entityCount: number;
  readonly systemTimings: Readonly<Record<string, number>>;
}

// Type guards
export function isValidGridPosition(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0;
}

export function createGridPosition(x: number, y: number): GridPosition | null {
  if (isValidGridPosition(x, y)) {
    return { x, y };
  }
  return null;
}


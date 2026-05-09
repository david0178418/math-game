import { GAME_CONFIG, SCORE_THRESHOLDS } from '../game/config';
import type { Components } from './Engine';
import type { PlayerEntity } from './queries';

// Simple caches for expensive calculations
const gridToPixelCache = new Map<string, { x: number; y: number }>();
const pixelToGridCache = new Map<string, { x: number; y: number }>();

/**
 * Game Utility Functions
 * Common operations used across multiple systems
 */

/**
 * Calculate difficulty-based intervals for various game mechanics
 */
export function calculateDifficultyInterval(
  baseInterval: number,
  minInterval: number,
  difficultyScaleScore: number,
  reductionPerLevel: number,
  playerScore: number
): number {
  const difficultyLevel = Math.floor(playerScore / difficultyScaleScore);
  const adjustedInterval = baseInterval - (difficultyLevel * reductionPerLevel);
  return Math.max(adjustedInterval, minInterval);
}

/**
 * Get player difficulty level based on score
 */
export function getPlayerDifficultyLevel(player: PlayerEntity): 'Easy' | 'Medium' | 'Hard' {
  const score = player.components.player.score;
  if (score < SCORE_THRESHOLDS.MEDIUM_DIFFICULTY_SCORE) return 'Easy';
  if (score < SCORE_THRESHOLDS.HARD_DIFFICULTY_SCORE) return 'Medium';
  return 'Hard';
}

/**
 * Check if two positions are on the same grid cell
 */
export function sameGridPosition(
  pos1: { x: number; y: number }, 
  pos2: { x: number; y: number }
): boolean {
  const gridX1 = Math.round(pos1.x / GAME_CONFIG.GRID.CELL_SIZE);
  const gridY1 = Math.round(pos1.y / GAME_CONFIG.GRID.CELL_SIZE);
  const gridX2 = Math.round(pos2.x / GAME_CONFIG.GRID.CELL_SIZE);
  const gridY2 = Math.round(pos2.y / GAME_CONFIG.GRID.CELL_SIZE);
  
  return gridX1 === gridX2 && gridY1 === gridY2;
}

/**
 * Convert pixel coordinates to grid coordinates
 */
export function pixelToGrid(x: number, y: number): { x: number; y: number } {
  const key = `${x},${y}`;
  let result = pixelToGridCache.get(key);
  
  if (!result) {
    result = {
      x: Math.round(x / GAME_CONFIG.GRID.CELL_SIZE),
      y: Math.round(y / GAME_CONFIG.GRID.CELL_SIZE)
    };
    
    // Limit cache size to prevent memory growth
    if (pixelToGridCache.size >= 100) {
      const firstKey = pixelToGridCache.keys().next().value;
      if (firstKey) {
        pixelToGridCache.delete(firstKey);
      }
    }
    
    pixelToGridCache.set(key, result);
  }
  
  return result;
}

/**
 * Convert grid coordinates to pixel coordinates
 */
export function gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
  const key = `${gridX},${gridY}`;
  let result = gridToPixelCache.get(key);
  
  if (!result) {
    result = {
      x: gridX * GAME_CONFIG.GRID.CELL_SIZE,
      y: gridY * GAME_CONFIG.GRID.CELL_SIZE
    };
    
    // Limit cache size to prevent memory growth
    if (gridToPixelCache.size >= 100) {
      const firstKey = gridToPixelCache.keys().next().value;
      if (firstKey) {
        gridToPixelCache.delete(firstKey);
      }
    }
    
    gridToPixelCache.set(key, result);
  }
  
  return result;
}

/**
 * Clear directional input flags. `eat` is intentionally untouched since
 * it's consumed by CollisionSystem after movement has resolved.
 */
export function clearDirectionalInput(input: Components['player']['inputState']): void {
  input.up = false;
  input.down = false;
  input.left = false;
  input.right = false;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate distance between two points
 */
export function distance(
  p1: { x: number; y: number }, 
  p2: { x: number; y: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a value is within a range (inclusive)
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Normalize an angle to 0-2π range
 */
export function normalizeAngle(angle: number): number {
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
} 
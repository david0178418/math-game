import { CELL_SIZE } from '../game/config';
import type { PlayerEntity } from './queries';

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
  if (score < 50) return 'Easy';
  if (score < 200) return 'Medium';
  return 'Hard';
}

/**
 * Check if two positions are on the same grid cell
 */
export function sameGridPosition(
  pos1: { x: number; y: number }, 
  pos2: { x: number; y: number }
): boolean {
  const gridX1 = Math.round(pos1.x / CELL_SIZE);
  const gridY1 = Math.round(pos1.y / CELL_SIZE);
  const gridX2 = Math.round(pos2.x / CELL_SIZE);
  const gridY2 = Math.round(pos2.y / CELL_SIZE);
  
  return gridX1 === gridX2 && gridY1 === gridY2;
}

/**
 * Convert pixel coordinates to grid coordinates
 */
export function pixelToGrid(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.round(x / CELL_SIZE),
    y: Math.round(y / CELL_SIZE)
  };
}

/**
 * Convert grid coordinates to pixel coordinates
 */
export function gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: gridX * CELL_SIZE,
    y: gridY * CELL_SIZE
  };
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
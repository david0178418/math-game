import { GAME_CONFIG, SCORE_THRESHOLDS } from '../game/config';
import type { GameTimer } from './Engine';
import type { PlayerEntity } from './queries';

/**
 * Fraction of a timer's duration still remaining, in [0, 1].
 * Returns 1 when the timer is absent — useful for entities that haven't been
 * given the slot yet.
 */
export const timerProgress = (timer: GameTimer | undefined): number =>
  timer ? Math.max(0, 1 - timer.elapsed / timer.duration) : 1;

export function getPlayerDifficultyLevel(player: PlayerEntity): 'Easy' | 'Medium' | 'Hard' {
  const score = player.components.player.score;
  if (score < SCORE_THRESHOLDS.MEDIUM_DIFFICULTY_SCORE) return 'Easy';
  if (score < SCORE_THRESHOLDS.HARD_DIFFICULTY_SCORE) return 'Medium';
  return 'Hard';
}

export function sameGridPosition(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): boolean {
  const cell = GAME_CONFIG.GRID.CELL_SIZE;
  return Math.round(pos1.x / cell) === Math.round(pos2.x / cell)
    && Math.round(pos1.y / cell) === Math.round(pos2.y / cell);
}

export function pixelToGrid(x: number, y: number): { x: number; y: number } {
  const cell = GAME_CONFIG.GRID.CELL_SIZE;
  return { x: Math.round(x / cell), y: Math.round(y / cell) };
}

export function gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
  const cell = GAME_CONFIG.GRID.CELL_SIZE;
  return { x: gridX * cell, y: gridY * cell };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

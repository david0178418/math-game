import { gameEngine } from '../Engine';
import type { GameAction } from '../types';
import { GAME_CONFIG } from '../../config';
import { startGridMovement, isEntityAnimating } from './AnimationSystem';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { playerQuery } from '../queries';
import { clamp } from '../gameUtils';

type Direction = Extract<GameAction, 'up' | 'down' | 'left' | 'right'>;

const DIRECTIONS = ['up', 'down', 'left', 'right'] as const satisfies readonly Direction[];

const DIRECTION_DELTAS = {
  up:    { dx:  0, dy: -1, rotation:   0 },
  right: { dx:  1, dy:  0, rotation:  90 },
  down:  { dx:  0, dy:  1, rotation: 180 },
  left:  { dx: -1, dy:  0, rotation: 270 },
} as const satisfies Record<Direction, { dx: number; dy: number; rotation: number }>;

const shortestRotation = (current: number, target: number): number => {
  if (Math.abs(target - current) <= 180) return target;
  return target > current ? target - 360 : target + 360;
};

export function addMovementSystemToEngine(): void {
  gameEngine.addSystem('movementSystem')
    .setPriority(SYSTEM_PRIORITIES.MOVEMENT)
    .withResources(['inputState'])
    .setProcessEach(playerQuery, ({ entity, ecs, resources: { inputState } }) => {
      const position = entity.components.position;
      const player = entity.components.player;

      if (player.gameOverPending) return;
      if (entity.components.timers.freeze?.active) return;
      if (isEntityAnimating(ecs, entity.id)) return;

      const pressed = DIRECTIONS.filter(d => inputState.actions.justActivated(d));
      if (pressed.length !== 1) return;

      const delta = DIRECTION_DELTAS[pressed[0]];
      const currentGridX = Math.round(position.x / GAME_CONFIG.GRID.CELL_SIZE);
      const currentGridY = Math.round(position.y / GAME_CONFIG.GRID.CELL_SIZE);
      const newGridX = clamp(currentGridX + delta.dx, 0, GAME_CONFIG.GRID.WIDTH - 1);
      const newGridY = clamp(currentGridY + delta.dy, 0, GAME_CONFIG.GRID.HEIGHT - 1);
      const newPixelX = newGridX * GAME_CONFIG.GRID.CELL_SIZE;
      const newPixelY = newGridY * GAME_CONFIG.GRID.CELL_SIZE;

      if (newPixelX === position.x && newPixelY === position.y) return;

      const targetRotation = shortestRotation(position.rotation ?? 0, delta.rotation);

      startGridMovement(ecs, entity.id, newPixelX, newPixelY, targetRotation);
    });
}

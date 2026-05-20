import { gameEngine, type GameEngine } from '../Engine';
import type { GameAction } from '../types';
import { GAME_CONFIG, MOVEMENT_CONFIG } from '../../config';
import { startRotationTween } from './AnimationSystem';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { playerMovementQuery } from '../queries';
import { clamp, gridToPixel } from '../gameUtils';

type Direction = Extract<GameAction, 'up' | 'down' | 'left' | 'right'>;

const DIRECTIONS = ['up', 'down', 'left', 'right'] as const satisfies readonly Direction[];

const DIRECTION_DELTAS = {
  up:    { dx:  0, dy: -1 },
  right: { dx:  1, dy:  0 },
  down:  { dx:  0, dy:  1 },
  left:  { dx: -1, dy:  0 },
} as const satisfies Record<Direction, { dx: number; dy: number }>;

const shortestRotation = (current: number, target: number): number => {
  const diff = ((target - current) % 360 + 540) % 360 - 180;
  return current + diff;
};

const headingFromDelta = (dx: number, dy: number): number | undefined => {
  if (dx === 0 && dy === 0) return undefined;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 90 : 270;
  return dy > 0 ? 180 : 0;
};

const tryStartRotationTween = (
  ecs: GameEngine,
  entityId: number,
  currentRotation: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void => {
  const heading = headingFromDelta(toX - fromX, toY - fromY);
  if (heading === undefined) return;
  const targetRot = shortestRotation(currentRotation, heading);
  if (targetRot === currentRotation) return;
  startRotationTween(ecs, entityId, targetRot, MOVEMENT_CONFIG.ROTATION_TWEEN_MS);
};

export function addMovementSystemToEngine(): void {
  gameEngine.addSystem('movementSystem')
    .setPriority(SYSTEM_PRIORITIES.MOVEMENT)
    .withResources(['inputState'])
    .setProcessEach(playerMovementQuery, ({ entity, dt, ecs, resources: { inputState } }) => {
      const position = entity.components.position;
      const player = entity.components.player;
      const pf = entity.components.pathFollower;

      if (player.gameOverPending) return;

      const frozen = entity.components.timers.freeze?.active === true;

      // Phase A — input updates the breadcrumb queue. Skipped while frozen so
      // the player can't queue moves through a stun.
      if (!frozen) {
        const pressed = DIRECTIONS.filter(d => inputState.actions.justActivated(d));
        if (pressed.length === 1) {
          const delta = DIRECTION_DELTAS[pressed[0]];
          const cursor = pf.breadcrumbs.at(-1) ?? { x: pf.anchorGridX, y: pf.anchorGridY };
          const newCursorX = clamp(cursor.x + delta.dx, 0, GAME_CONFIG.GRID.WIDTH - 1);
          const newCursorY = clamp(cursor.y + delta.dy, 0, GAME_CONFIG.GRID.HEIGHT - 1);

          if (newCursorX !== cursor.x || newCursorY !== cursor.y) {
            // Rewrite-on-reversal: if the candidate is already in the path
            // (anchor + breadcrumbs), truncate to that point. Backtracking and
            // 180° reversals fall out naturally.
            const matchInBreadcrumbs = pf.breadcrumbs.findIndex(
              c => c.x === newCursorX && c.y === newCursorY,
            );
            const matchesAnchor = newCursorX === pf.anchorGridX && newCursorY === pf.anchorGridY;
            if (matchesAnchor) {
              pf.breadcrumbs = [];
            } else if (matchInBreadcrumbs >= 0) {
              pf.breadcrumbs = pf.breadcrumbs.slice(0, matchInBreadcrumbs + 1);
            } else if (pf.breadcrumbs.length < MOVEMENT_CONFIG.MAX_QUEUE_LENGTH) {
              pf.breadcrumbs = [...pf.breadcrumbs, { x: newCursorX, y: newCursorY }];
            }

            const headPx = gridToPixel(
              pf.breadcrumbs[0]?.x ?? pf.anchorGridX,
              pf.breadcrumbs[0]?.y ?? pf.anchorGridY,
            );
            tryStartRotationTween(
              ecs, entity.id, position.rotation ?? 0,
              position.x, position.y, headPx.x, headPx.y,
            );
          }
        }
      }

      // Phase B — motion.
      if (frozen) {
        pf.speed = 0;
        return;
      }

      const head = pf.breadcrumbs[0];
      const targetGrid = head ?? { x: pf.anchorGridX, y: pf.anchorGridY };
      const target = gridToPixel(targetGrid.x, targetGrid.y);

      const dx = target.x - position.x;
      const dy = target.y - position.y;
      const remaining = Math.abs(dx) + Math.abs(dy);

      if (remaining < 1e-3 && pf.breadcrumbs.length === 0) {
        pf.speed = 0;
        position.x = target.x;
        position.y = target.y;
        return;
      }

      // Brake only when one cell remains and we're within braking distance;
      // otherwise accelerate toward MAX_SPEED.
      const brakeDistance = (pf.speed * pf.speed) / (2 * MOVEMENT_CONFIG.ACCEL);
      const shouldBrake = pf.breadcrumbs.length <= 1 && remaining <= brakeDistance;
      const accel = shouldBrake ? -MOVEMENT_CONFIG.ACCEL : MOVEMENT_CONFIG.ACCEL;
      pf.speed = clamp(pf.speed + accel * dt, 0, MOVEMENT_CONFIG.MAX_SPEED);

      // Cardinal motion. Heading is recomputed each frame from sign(target - pos),
      // so a queue rewrite reversing direction flips the fly immediately.
      const step = pf.speed * dt;
      if (remaining > step) {
        position.x += Math.sign(dx) * step;
        position.y += Math.sign(dy) * step;
        return;
      }

      position.x = target.x;
      position.y = target.y;
      if (pf.breadcrumbs.length === 0) return;

      pf.anchorGridX = targetGrid.x;
      pf.anchorGridY = targetGrid.y;
      pf.breadcrumbs = pf.breadcrumbs.slice(1);
      const next = pf.breadcrumbs[0];
      if (!next) return;
      const nextPx = gridToPixel(next.x, next.y);
      tryStartRotationTween(
        ecs, entity.id, position.rotation ?? 0,
        position.x, position.y, nextPx.x, nextPx.y,
      );
    });
}

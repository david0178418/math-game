import { gameEngine, type GameEngine } from '../Engine';
import { GAME_CONFIG } from '../../game/config';
import { pixelToGrid } from '../gameUtils';
import {
  createCoroutine,
  waitSeconds,
  waitUntil,
  type CoroutineGenerator,
} from 'ecspresso/plugins/scripting/coroutine';
import type { AllComponents } from '../Engine';

const FROG_CONFIG = GAME_CONFIG.ENEMY_TYPES.FROG;
const CELL = GAME_CONFIG.GRID.CELL_SIZE;

const DIRECTIONS = [
  { x:  0, y: -1 },
  { x:  0, y:  1 },
  { x: -1, y:  0 },
  { x:  1, y:  0 },
] as const;

const COOLDOWN_SECONDS = FROG_CONFIG.TONGUE_COOLDOWN / 1000;
const HOLD_SECONDS = FROG_CONFIG.TONGUE_HOLD_DURATION / 1000;
// Preserve original feel: probability is per 60Hz frame, not per second.
const PER_FRAME_ATTACK_CHANCE = FROG_CONFIG.TONGUE_ATTACK_PROBABILITY * (1 / 60);

// `initializeFrogTongue` guarantees the frogTongue component is attached
// alongside the coroutine, so a missing component would indicate a logic bug.
function getTongue(ecs: GameEngine, entityId: number): AllComponents['frogTongue'] {
  const c = ecs.entityManager.getComponent(entityId, 'frogTongue');
  if (!c) throw new Error(`frog ${entityId} missing frogTongue component`);
  return c;
}

function* tongueLifecycle(frogId: number): CoroutineGenerator {
  while (true) {
    const tongue = getTongue(gameEngine, frogId);
    tongue.phase = 'idle';
    tongue.segments = [];
    tongue.currentLength = 0;
    tongue.direction = { x: 0, y: 0 };

    yield* waitSeconds(COOLDOWN_SECONDS);
    yield* waitUntil(() => Math.random() < PER_FRAME_ATTACK_CHANCE);

    tongue.phase = 'extending';
    tongue.direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    console.log(`🐸 Frog ${frogId} starting tongue attack in direction (${tongue.direction.x}, ${tongue.direction.y})`);

    const maxLength = tongue.maxRange * CELL;
    while (tongue.currentLength < maxLength) {
      const dt: number = yield;
      tongue.currentLength = Math.min(tongue.currentLength + FROG_CONFIG.TONGUE_SPEED * dt, maxLength);
      updateTongueSegments(frogId, tongue);
      // Segments stopped growing despite remaining range — hit obstacle.
      const expectedSegments = Math.floor(tongue.currentLength / CELL);
      if (tongue.segments.length < expectedSegments && tongue.segments.length < tongue.maxRange) break;
    }

    tongue.phase = 'holding';
    yield* waitSeconds(HOLD_SECONDS);

    tongue.phase = 'retracting';
    while (tongue.currentLength > 0) {
      const dt: number = yield;
      tongue.currentLength = Math.max(0, tongue.currentLength - FROG_CONFIG.TONGUE_SPEED * dt);
      updateTongueSegments(frogId, tongue);
    }
  }
}

function updateTongueSegments(frogId: number, tongue: AllComponents['frogTongue']): void {
  const frogPos = gameEngine.entityManager.getComponent(frogId, 'position');
  if (!frogPos) throw new Error(`frog ${frogId} missing position component`);

  tongue.segments = [];

  if (tongue.direction.x === 0 && tongue.direction.y === 0) return;

  const tongueGridLength = Math.floor(tongue.currentLength / CELL);
  if (tongueGridLength <= 0) return;

  const frogGrid = pixelToGrid(frogPos.x, frogPos.y);
  const blockedCells = collectBlockedCells(gameEngine, frogId);

  for (let i = 1; i <= tongueGridLength; i++) {
    const gx = frogGrid.x + tongue.direction.x * i;
    const gy = frogGrid.y + tongue.direction.y * i;

    if (gx < 0 || gx >= GAME_CONFIG.GRID.WIDTH || gy < 0 || gy >= GAME_CONFIG.GRID.HEIGHT) {
      console.log(`🐸 Tongue hit grid boundary at (${gx}, ${gy}), stopping extension`);
      break;
    }

    if (blockedCells.has(`${gx},${gy}`)) {
      console.log(`🐸 Tongue hit obstacle at grid (${gx}, ${gy}), stopping extension`);
      break;
    }

    tongue.segments.push({ x: gx, y: gy });
  }
}

function collectBlockedCells(ecs: GameEngine, frogId: number): Set<string> {
  const blocked = new Set<string>();
  for (const enemy of ecs.entityManager.getEntitiesWithQuery(['enemy', 'position'])) {
    if (enemy.id === frogId) continue;
    const grid = pixelToGrid(enemy.components.position.x, enemy.components.position.y);
    blocked.add(`${grid.x},${grid.y}`);
  }
  for (const player of ecs.entityManager.getEntitiesWithQuery(['player', 'position'])) {
    const grid = pixelToGrid(player.components.position.x, player.components.position.y);
    blocked.add(`${grid.x},${grid.y}`);
  }
  return blocked;
}

export function initializeFrogTongue(frogId: number): void {
  gameEngine.entityManager.addComponent(frogId, 'frogTongue', {
    direction: { x: 0, y: 0 },
    maxRange: FROG_CONFIG.TONGUE_RANGE,
    currentLength: 0,
    segments: [],
    phase: 'idle',
  });
  gameEngine.entityManager.addComponent(
    frogId,
    'coroutine',
    createCoroutine(tongueLifecycle(frogId)).coroutine,
  );

  console.log(`🐸 Initialized frog tongue for entity ${frogId}`);
}

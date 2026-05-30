import { gameEngine, type GameEngine } from '../Engine';
import { GAME_CONFIG } from '../../config';
import { pixelToGrid } from '../gameUtils';
import {
  createCoroutine,
  waitSeconds,
  waitUntil,
  type CoroutineGenerator,
} from 'ecspresso/plugins/scripting/coroutine';
import type { AllComponents } from '../types';
import { isEntityAnimating } from './AnimationSystem';
import { closeFrogMouth, startFrogTongueAnimation } from './FrogSpriteSystem';

const FROG_CONFIG = GAME_CONFIG.ENEMY_TYPES.frog;
const CELL = GAME_CONFIG.GRID.CELL_SIZE;

const DIRECTIONS = [
  { x:  0, y: -1 },
  { x:  0, y:  1 },
  { x: -1, y:  0 },
  { x:  1, y:  0 },
] as const;

const COOLDOWN_SECONDS = FROG_CONFIG.TONGUE_COOLDOWN / 1000;
const HOLD_SECONDS = FROG_CONFIG.TONGUE_HOLD_DURATION / 1000;
const ATTACK_DELAY_MIN_SECONDS = FROG_CONFIG.TONGUE_ATTACK_DELAY_MIN / 1000;
const ATTACK_DELAY_MAX_SECONDS = FROG_CONFIG.TONGUE_ATTACK_DELAY_MAX / 1000;

const randomAttackDelaySeconds = (): number =>
  ATTACK_DELAY_MIN_SECONDS + Math.random() * (ATTACK_DELAY_MAX_SECONDS - ATTACK_DELAY_MIN_SECONDS);

// `initializeFrogTongue` guarantees the frogTongue component is attached
// alongside the coroutine, so a missing component would indicate a logic bug.
function getTongue(ecs: GameEngine, entityId: number): AllComponents['frogTongue'] {
  const c = ecs.entityManager.getComponent(entityId, 'frogTongue');
  if (!c) throw new Error(`frog ${entityId} missing frogTongue component`);
  return c;
}

const markTongueChanged = (frogId: number): void => {
  gameEngine.markChanged(frogId, 'frogTongue');
};

function* tongueLifecycle(frogId: number): CoroutineGenerator {
  while (true) {
    const tongue = getTongue(gameEngine, frogId);
    tongue.phase = 'idle';
    tongue.segments = [];
    tongue.currentLength = 0;
    tongue.direction = { x: 0, y: 0 };
    markTongueChanged(frogId);

    yield* waitSeconds(COOLDOWN_SECONDS);
    yield* waitSeconds(randomAttackDelaySeconds());
    yield* waitUntil(() => !isEntityAnimating(gameEngine, frogId));

    const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    tongue.direction = direction;
    startFrogTongueAnimation(gameEngine, frogId, direction);
    tongue.phase = 'extending';
    markTongueChanged(frogId);
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
    markTongueChanged(frogId);
    yield* waitSeconds(HOLD_SECONDS);

    tongue.phase = 'retracting';
    markTongueChanged(frogId);
    while (tongue.currentLength > 0) {
      const dt: number = yield;
      tongue.currentLength = Math.max(0, tongue.currentLength - FROG_CONFIG.TONGUE_SPEED * dt);
      updateTongueSegments(frogId, tongue);
    }
    yield* waitSeconds(closeFrogMouth(gameEngine, frogId));
  }
}

function updateTongueSegments(frogId: number, tongue: AllComponents['frogTongue']): void {
  const frogPos = gameEngine.entityManager.getComponent(frogId, 'position');
  if (!frogPos) throw new Error(`frog ${frogId} missing position component`);

  tongue.segments = [];

  if (tongue.direction.x === 0 && tongue.direction.y === 0) {
    markTongueChanged(frogId);
    return;
  }

  const tongueGridLength = Math.floor(tongue.currentLength / CELL);
  if (tongueGridLength <= 0) {
    markTongueChanged(frogId);
    return;
  }

  const frogGrid = pixelToGrid(frogPos.x, frogPos.y);
  const blockedCells = collectEnemyBlockedCells(gameEngine, frogId);

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

  markTongueChanged(frogId);
}

function collectEnemyBlockedCells(ecs: GameEngine, frogId: number): Set<string> {
  return new Set(
    ecs.entityManager
      .getEntitiesWithQuery(['enemy', 'position'])
      .filter(enemy => enemy.id !== frogId)
      .map(enemy => {
        const grid = pixelToGrid(enemy.components.position.x, enemy.components.position.y);
        return `${grid.x},${grid.y}`;
      })
  );
}

function initializeFrogTongue(frogId: number): void {
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

/** True while the frog is mid-tongue (any non-idle phase). */
export const isFrogAttacking = (tongue: AllComponents['frogTongue'] | undefined): boolean =>
  tongue !== undefined && tongue.phase !== 'idle';

/**
 * Register a reactive query that wires up the tongue coroutine for any
 * frog-type enemy as soon as it spawns.
 */
export function registerFrogTongueInit(): void {
  gameEngine.addReactiveQuery('frog-init', {
    with: ['enemy'],
    onEnter: (entity) => {
      if (entity.components.enemy.enemyType === 'frog') {
        initializeFrogTongue(entity.id);
      }
    },
  });
}

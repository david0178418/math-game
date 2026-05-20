import { gameEngine, type GameEngine } from '../Engine';
import { GAME_CONFIG } from '../../game/config';
import { pixelToGrid } from '../gameUtils';
import {
  createStateMachine,
  createStateMachineHelpers,
  type StateMachine,
} from 'ecspresso/plugins/scripting/state-machine';
import type { AllComponents } from '../Engine';

// Tongue lifecycle runs on the ecspresso state-machine plugin's system —
// no per-frog system needed.

const FROG_CONFIG = GAME_CONFIG.ENEMY_TYPES.FROG;
const CELL = GAME_CONFIG.GRID.CELL_SIZE;

const { defineStateMachine } = createStateMachineHelpers<GameEngine>();

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

// `initializeFrogTongue` guarantees frogTongue + stateMachine are attached
// together, so missing-component cases here would indicate a logic bug.
function getTongue(ecs: GameEngine, entityId: number): AllComponents['frogTongue'] {
  const c = ecs.entityManager.getComponent(entityId, 'frogTongue');
  if (!c) throw new Error(`frog ${entityId} missing frogTongue component`);
  return c;
}
function getStateMachine(ecs: GameEngine, entityId: number): StateMachine {
  const c = ecs.entityManager.getComponent(entityId, 'stateMachine');
  if (!c) throw new Error(`frog ${entityId} missing stateMachine component`);
  return c;
}

const frogTongueFSM = defineStateMachine('frogTongue', {
  initial: 'idle',
  states: {
    idle: {
      onEnter: ({ ecs, entityId }) => {
        const tongue = getTongue(ecs, entityId);
        tongue.isExtended = false;
        tongue.segments = [];
        tongue.currentLength = 0;
        tongue.direction = { x: 0, y: 0 };
      },
      transitions: [{
        target: 'extending',
        guard: ({ ecs, entityId }): boolean => {
          const sm = getStateMachine(ecs, entityId);
          if (sm.stateTime < COOLDOWN_SECONDS) return false;
          return Math.random() < PER_FRAME_ATTACK_CHANCE;
        },
      }],
    },

    extending: {
      onEnter: ({ ecs, entityId }) => {
        const tongue = getTongue(ecs, entityId);
        tongue.isExtended = true;
        tongue.direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        tongue.currentLength = 0;
        tongue.segments = [];
        console.log(`🐸 Frog ${entityId} starting tongue attack in direction (${tongue.direction.x}, ${tongue.direction.y})`);
      },
      onUpdate: ({ ecs, entityId, dt }) => {
        const tongue = getTongue(ecs, entityId);
        tongue.currentLength = Math.min(
          tongue.currentLength + FROG_CONFIG.TONGUE_SPEED * dt,
          tongue.maxRange * CELL,
        );
        updateTongueSegments(ecs, entityId);
      },
      transitions: [{
        target: 'holding',
        guard: ({ ecs, entityId }): boolean => {
          const tongue = getTongue(ecs, entityId);
          if (tongue.currentLength >= tongue.maxRange * CELL) return true;
          // Segments stopped growing despite remaining range — hit obstacle.
          const expectedSegments = Math.floor(tongue.currentLength / CELL);
          return tongue.segments.length < expectedSegments
              && tongue.segments.length < tongue.maxRange;
        },
      }],
    },

    holding: {
      transitions: [{
        target: 'retracting',
        guard: ({ ecs, entityId }): boolean => {
          const sm = getStateMachine(ecs, entityId);
          return sm.stateTime >= HOLD_SECONDS;
        },
      }],
    },

    retracting: {
      onUpdate: ({ ecs, entityId, dt }) => {
        const tongue = getTongue(ecs, entityId);
        tongue.currentLength = Math.max(0, tongue.currentLength - FROG_CONFIG.TONGUE_SPEED * dt);
        updateTongueSegments(ecs, entityId);
      },
      transitions: [{
        target: 'idle',
        guard: ({ ecs, entityId }): boolean => {
          const tongue = getTongue(ecs, entityId);
          return tongue.currentLength <= 0;
        },
      }],
    },
  },
});

function updateTongueSegments(ecs: GameEngine, frogId: number): void {
  const tongue = getTongue(ecs, frogId);
  const frogPos = ecs.entityManager.getComponent(frogId, 'position');
  if (!frogPos) throw new Error(`frog ${frogId} missing position component`);

  tongue.segments = [];

  if (tongue.direction.x === 0 && tongue.direction.y === 0) return;

  const tongueGridLength = Math.floor(tongue.currentLength / CELL);
  if (tongueGridLength <= 0) return;

  const frogGrid = pixelToGrid(frogPos.x, frogPos.y);
  const blockedCells = collectBlockedCells(ecs, frogId);

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
    isExtended: false,
    direction: { x: 0, y: 0 },
    maxRange: FROG_CONFIG.TONGUE_RANGE,
    currentLength: 0,
    segments: [],
  });
  const { stateMachine } = createStateMachine(frogTongueFSM);
  gameEngine.entityManager.addComponent(frogId, 'stateMachine', stateMachine);

  console.log(`🐸 Initialized frog tongue for entity ${frogId}`);
}

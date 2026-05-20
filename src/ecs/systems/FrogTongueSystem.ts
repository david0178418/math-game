import { gameEngine, createTimer } from '../Engine';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { GAME_CONFIG } from '../../game/config';
import { pixelToGrid } from '../gameUtils';
import { 
  enemyQuery, 
  playerQuery,
  frogTongueQuery,
  type EnemyEntity,
  type PlayerEntity,
  type FrogTongueEntity
} from '../queries';

/**
 * Frog Tongue System
 * Manages frog tongue extension, retraction, and collision detection
 */

// Use centralized frog configuration
const FROG_CONFIG = GAME_CONFIG.ENEMY_TYPES.FROG;

// Add queries to the system for obstacle detection
export function addFrogTongueSystemToEngine(): void {
  gameEngine.addSystem('frogTongueSystem')
    .setPriority(SYSTEM_PRIORITIES.FROG_TONGUE)
    .addQuery('frogs', frogTongueQuery)
    .addQuery('enemies', enemyQuery)
    .addSingleton('player', playerQuery)
    .setProcess(({ queries, dt }) => {
      // Store entities for obstacle checking
      currentEnemies = queries.enemies;
      currentPlayer = queries.player;

      for (const frog of queries.frogs) {
        processFrogTongue(frog, dt);
      }
    });
}

// Store current entities for obstacle checking
let currentEnemies: EnemyEntity[] = [];
let currentPlayer: PlayerEntity | undefined;

function processFrogTongue(frog: FrogTongueEntity, deltaTime: number): void {
  const tongue = frog.components.frogTongue;

  switch (tongue.phase) {
    case 'idle':
      processIdlePhase(frog);
      break;
    case 'extending':
      processExtendingPhase(frog, deltaTime);
      break;
    case 'holding':
      processHoldingPhase(frog);
      break;
    case 'retracting':
      processRetractingPhase(frog, deltaTime);
      break;
  }
}

function processIdlePhase(frog: FrogTongueEntity): void {
  // tonguePhase timer holds the post-attack cooldown
  if (frog.components.timers.tonguePhase?.active) return;

  const attackChance = FROG_CONFIG.TONGUE_ATTACK_PROBABILITY * (1 / 60);
  if (Math.random() < attackChance) {
    startTongueAttack(frog);
  }
}

function processExtendingPhase(frog: FrogTongueEntity, deltaTime: number): void {
  const tongue = frog.components.frogTongue;
  const extensionSpeed = FROG_CONFIG.TONGUE_SPEED * deltaTime;

  tongue.currentLength = Math.min(tongue.currentLength + extensionSpeed, tongue.maxRange * GAME_CONFIG.GRID.CELL_SIZE);
  updateTongueSegments(frog);

  // Hit an obstacle: segments stopped growing despite remaining range
  const expectedSegments = Math.floor(tongue.currentLength / GAME_CONFIG.GRID.CELL_SIZE);
  const hitObstacle = tongue.segments.length < expectedSegments && tongue.segments.length < tongue.maxRange;

  if (tongue.currentLength >= tongue.maxRange * GAME_CONFIG.GRID.CELL_SIZE || hitObstacle) {
    tongue.phase = 'holding';
    frog.components.timers.tonguePhase = createTimer(FROG_CONFIG.TONGUE_HOLD_DURATION / 1000);
  }
}

function processHoldingPhase(frog: FrogTongueEntity): void {
  if (frog.components.timers.tonguePhase?.active) return;
  frog.components.frogTongue.phase = 'retracting';
}

function processRetractingPhase(frog: FrogTongueEntity, deltaTime: number): void {
  const tongue = frog.components.frogTongue;
  tongue.currentLength = Math.max(0, tongue.currentLength - FROG_CONFIG.TONGUE_SPEED * deltaTime);
  updateTongueSegments(frog);

  if (tongue.currentLength <= 0) {
    tongue.phase = 'idle';
    tongue.isExtended = false;
    tongue.segments = [];
    frog.components.timers.tonguePhase = createTimer(FROG_CONFIG.TONGUE_COOLDOWN / 1000);
  }
}

function startTongueAttack(frog: FrogTongueEntity): void {
  const tongue = frog.components.frogTongue;
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];
  const randomDirection = directions[Math.floor(Math.random() * directions.length)];

  tongue.isExtended = true;
  tongue.direction = randomDirection;
  tongue.currentLength = 0;
  tongue.phase = 'extending';
  tongue.segments = [];

  console.log(`🐸 Frog starting tongue attack in direction (${randomDirection.x}, ${randomDirection.y})`);
}

/**
 * Update tongue segment positions for collision detection
 */
function updateTongueSegments(frog: FrogTongueEntity): void {
  const tongue = frog.components.frogTongue;
  const frogPos = frog.components.position;
  const frogGrid = pixelToGrid(frogPos.x, frogPos.y);
  
  // Clear existing segments
  tongue.segments = [];
  
  // No segments if no direction set
  if (tongue.direction.x === 0 && tongue.direction.y === 0) {
    return;
  }
  
  // Calculate how many grid cells the tongue covers
  const tongueGridLength = Math.floor(tongue.currentLength / GAME_CONFIG.GRID.CELL_SIZE);
  
  if (tongueGridLength <= 0) {
    return;
  }
  
  // Create segments along the tongue path, stopping at obstacles
  for (let i = 1; i <= tongueGridLength; i++) {
    const segmentGridX = frogGrid.x + (tongue.direction.x * i);
    const segmentGridY = frogGrid.y + (tongue.direction.y * i);
    
    // Check if segment is within grid bounds
    if (segmentGridX >= 0 && segmentGridX < GAME_CONFIG.GRID.WIDTH && 
        segmentGridY >= 0 && segmentGridY < GAME_CONFIG.GRID.HEIGHT) {
      
      // Check if this position is blocked by another entity
      if (isPositionBlockedForTongue(segmentGridX, segmentGridY, frog.id)) {
        console.log(`🐸 Tongue hit obstacle at grid (${segmentGridX}, ${segmentGridY}), stopping extension`);
        break;
      }
      
      tongue.segments.push({ x: segmentGridX, y: segmentGridY });
    } else {
      console.log(`🐸 Tongue hit grid boundary at (${segmentGridX}, ${segmentGridY}), stopping extension`);
      break;
    }
  }
}

/**
 * Check if a grid position is blocked for tongue extension
 */
function isPositionBlockedForTongue(gridX: number, gridY: number, frogId: number): boolean {
  // Check against other enemies
  for (const enemy of currentEnemies) {
    // Skip the frog itself
    if (enemy.id === frogId) continue;
    
    const enemyGridX = Math.round(enemy.components.position.x / GAME_CONFIG.GRID.CELL_SIZE);
    const enemyGridY = Math.round(enemy.components.position.y / GAME_CONFIG.GRID.CELL_SIZE);
    
    if (enemyGridX === gridX && enemyGridY === gridY) {
      return true;
    }
  }
  
  // Check against player
  if (currentPlayer) {
    const playerGridX = Math.round(currentPlayer.components.position.x / GAME_CONFIG.GRID.CELL_SIZE);
    const playerGridY = Math.round(currentPlayer.components.position.y / GAME_CONFIG.GRID.CELL_SIZE);

    if (playerGridX === gridX && playerGridY === gridY) {
      return true;
    }
  }

  return false;
}

/**
 * Initialize frog tongue component for a frog entity
 */
export function initializeFrogTongue(frogId: number): void {
  gameEngine.entityManager.addComponent(frogId, 'frogTongue', {
    isExtended: false,
    direction: { x: 0, y: 0 },
    maxRange: FROG_CONFIG.TONGUE_RANGE,
    currentLength: 0,
    phase: 'idle',
    segments: [],
  });

  console.log(`🐸 Initialized frog tongue for entity ${frogId}`);
} 
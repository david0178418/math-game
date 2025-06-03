import { gameEngine } from '../Engine';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { createQueryDefinition } from 'ecspresso';
import type { Components } from '../Engine';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../../game/config';
import { pixelToGrid } from './MovementSystem';
import { 
  enemyQuery, 
  playerQuery,
  type EnemyEntity,
  type PlayerEntity
} from '../queries';

/**
 * Frog Tongue System
 * Manages frog tongue extension, retraction, and collision detection
 */

// Query for frog entities
const frogQuery = createQueryDefinition({
  with: ['position', 'enemy', 'frogTongue']
});

type FrogEntity = {
  id: number;
  components: {
    position: Components['position'];
    enemy: Components['enemy'];
    frogTongue: Components['frogTongue'];
  };
};

// Configuration
const FROG_CONFIG = {
  TONGUE_EXTENSION_SPEED: 424,  // pixels per second (106 pixels / 0.25 seconds = 424)
  TONGUE_ATTACK_PROBABILITY: 0.1, // 10% chance per second to attack
  TONGUE_COOLDOWN: 2000,        // 2 seconds between attacks
  TONGUE_HOLD_DURATION: 1000,   // 1 second hold when fully extended
  MAX_TONGUE_RANGE: 3           // 3 tiles maximum
};

// Add queries to the system for obstacle detection
export function addFrogTongueSystemToEngine(): void {
  gameEngine.addSystem('frogTongueSystem')
    .setPriority(SYSTEM_PRIORITIES.FROG_TONGUE)
    .addQuery('frogs', frogQuery)
    .addQuery('enemies', enemyQuery)
    .addQuery('players', playerQuery)
    .setProcess((queries, deltaTime) => {
      const frogs = queries.frogs as FrogEntity[];
      const enemies = queries.enemies as EnemyEntity[];
      const players = queries.players as PlayerEntity[];
      const currentTime = performance.now();
      
      // Store entities for obstacle checking
      currentEnemies = enemies;
      currentPlayers = players;
      
      // Process each frog's tongue behavior
      for (const frog of frogs) {
        processFrogTongue(frog, currentTime, deltaTime);
      }
    })
    .build();
}

// Store current entities for obstacle checking
let currentEnemies: EnemyEntity[] = [];
let currentPlayers: PlayerEntity[] = [];

/**
 * Process a single frog's tongue behavior
 */
function processFrogTongue(frog: FrogEntity, currentTime: number, deltaTime: number): void {
  const tongue = frog.components.frogTongue;
  
  switch (tongue.phase) {
    case 'idle':
      processIdlePhase(frog, currentTime);
      break;
    case 'extending':
      processExtendingPhase(frog, currentTime, deltaTime);
      break;
    case 'holding':
      processHoldingPhase(frog, currentTime);
      break;
    case 'retracting':
      processRetractingPhase(frog, currentTime, deltaTime);
      break;
  }
}

/**
 * Process idle phase - randomly decide to attack
 */
function processIdlePhase(frog: FrogEntity, currentTime: number): void {
  const tongue = frog.components.frogTongue;
  
  // Check if enough time has passed since last attack
  const timeSinceLastAttack = currentTime - tongue.startTime;
  if (timeSinceLastAttack < FROG_CONFIG.TONGUE_COOLDOWN) {
    return;
  }
  
  // Random chance to start tongue attack
  const attackChance = FROG_CONFIG.TONGUE_ATTACK_PROBABILITY * (1/60); // Per frame probability
  if (Math.random() < attackChance) {
    startTongueAttack(frog, currentTime);
  }
}

/**
 * Process extending phase - extend tongue towards target
 */
function processExtendingPhase(frog: FrogEntity, currentTime: number, deltaTime: number): void {
  const tongue = frog.components.frogTongue;
  const extensionSpeed = FROG_CONFIG.TONGUE_EXTENSION_SPEED * deltaTime;
  
  // Calculate how far the tongue should extend
  const targetExtension = Math.min(tongue.currentLength + extensionSpeed, tongue.maxRange * CELL_SIZE);
  const previousLength = tongue.currentLength;
  tongue.currentLength = targetExtension;
  
  // Update tongue segments
  updateTongueSegments(frog);
  
  // Check if we hit an obstacle (segments stopped growing despite having range left)
  const segmentCount = tongue.segments.length;
  const expectedSegments = Math.floor(tongue.currentLength / CELL_SIZE);
  const hitObstacle = segmentCount < expectedSegments && segmentCount < tongue.maxRange;
  
  // Check if fully extended or hit an obstacle
  if (tongue.currentLength >= tongue.maxRange * CELL_SIZE || hitObstacle) {
    console.log(`🐸 Frog tongue fully extended (${segmentCount} segments), starting hold phase`);
    tongue.phase = 'holding';
    tongue.startTime = currentTime;
  } else {
    // Log progress every quarter second
    const currentSegments = Math.floor(tongue.currentLength / CELL_SIZE);
    const previousSegments = Math.floor(previousLength / CELL_SIZE);
    if (currentSegments > previousSegments) {
      console.log(`🐸 Frog tongue extended to ${currentSegments} segments`);
    }
  }
}

/**
 * Process holding phase - keep tongue extended for 1 second
 */
function processHoldingPhase(frog: FrogEntity, currentTime: number): void {
  const tongue = frog.components.frogTongue;
  const timeHeld = currentTime - tongue.startTime;
  
  if (timeHeld >= FROG_CONFIG.TONGUE_HOLD_DURATION) {
    console.log(`🐸 Frog tongue hold complete, starting retraction`);
    tongue.phase = 'retracting';
    tongue.startTime = currentTime;
  }
}

/**
 * Process retracting phase - retract tongue back to frog
 */
function processRetractingPhase(frog: FrogEntity, currentTime: number, deltaTime: number): void {
  const tongue = frog.components.frogTongue;
  const retractionSpeed = FROG_CONFIG.TONGUE_EXTENSION_SPEED * deltaTime; // Same speed as extension
  
  // Retract the tongue
  const previousLength = tongue.currentLength;
  tongue.currentLength = Math.max(0, tongue.currentLength - retractionSpeed);
  
  // Update tongue segments
  updateTongueSegments(frog);
  
  // Log progress every quarter second
  const currentSegments = Math.floor(tongue.currentLength / CELL_SIZE);
  const previousSegments = Math.floor(previousLength / CELL_SIZE);
  if (currentSegments < previousSegments) {
    console.log(`🐸 Frog tongue retracted to ${currentSegments} segments`);
  }
  
  // Check if fully retracted
  if (tongue.currentLength <= 0) {
    console.log(`🐸 Frog tongue fully retracted, returning to idle`);
    tongue.phase = 'idle';
    tongue.isExtended = false;
    tongue.segments = [];
    tongue.startTime = currentTime;
  }
}

/**
 * Start a tongue attack in a random direction
 */
function startTongueAttack(frog: FrogEntity, currentTime: number): void {
  const tongue = frog.components.frogTongue;
  
  // Choose a random direction (up, down, left, right)
  const directions = [
    { x: 0, y: -1 },  // Up
    { x: 0, y: 1 },   // Down
    { x: -1, y: 0 },  // Left
    { x: 1, y: 0 }    // Right
  ];
  
  const randomDirection = directions[Math.floor(Math.random() * directions.length)];
  
  // Initialize tongue attack
  tongue.isExtended = true;
  tongue.direction = randomDirection;
  tongue.currentLength = 0;
  tongue.phase = 'extending';
  tongue.startTime = currentTime;
  tongue.segments = [];
  
  console.log(`🐸 Frog starting tongue attack in direction (${randomDirection.x}, ${randomDirection.y})`);
}

/**
 * Update tongue segment positions for collision detection
 */
function updateTongueSegments(frog: FrogEntity): void {
  const tongue = frog.components.frogTongue;
  const frogPos = frog.components.position;
  const frogGrid = pixelToGrid(frogPos.x, frogPos.y);
  
  // Clear existing segments
  tongue.segments = [];
  
  // Calculate how many grid cells the tongue covers
  const tongueGridLength = Math.floor(tongue.currentLength / CELL_SIZE);
  
  // Create segments along the tongue path, stopping at obstacles
  for (let i = 1; i <= tongueGridLength; i++) {
    const segmentGridX = frogGrid.x + (tongue.direction.x * i);
    const segmentGridY = frogGrid.y + (tongue.direction.y * i);
    
    // Check if segment is within grid bounds
    if (segmentGridX >= 0 && segmentGridX < GRID_WIDTH && 
        segmentGridY >= 0 && segmentGridY < GRID_HEIGHT) {
      
      // Check if this position is blocked by another entity
      if (isPositionBlockedForTongue(segmentGridX, segmentGridY, frog.id)) {
        // Hit an obstacle, stop extending here
        console.log(`🐸 Tongue hit obstacle at grid (${segmentGridX}, ${segmentGridY}), stopping extension`);
        break;
      }
      
      tongue.segments.push({ x: segmentGridX, y: segmentGridY });
    } else {
      // Hit grid boundary, stop extending
      console.log(`🐸 Tongue hit grid boundary, stopping extension`);
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
    
    const enemyGridX = Math.round(enemy.components.position.x / CELL_SIZE);
    const enemyGridY = Math.round(enemy.components.position.y / CELL_SIZE);
    
    if (enemyGridX === gridX && enemyGridY === gridY) {
      return true;
    }
  }
  
  // Check against players
  for (const player of currentPlayers) {
    const playerGridX = Math.round(player.components.position.x / CELL_SIZE);
    const playerGridY = Math.round(player.components.position.y / CELL_SIZE);
    
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
  const currentTime = performance.now();
  
  gameEngine.entityManager.addComponent(frogId, 'frogTongue', {
    isExtended: false,
    direction: { x: 0, y: 0 },
    maxRange: FROG_CONFIG.MAX_TONGUE_RANGE,
    currentLength: 0,
    startTime: currentTime,
    phase: 'idle',
    segments: []
  });
  
  console.log(`🐸 Initialized frog tongue for entity ${frogId}`);
} 
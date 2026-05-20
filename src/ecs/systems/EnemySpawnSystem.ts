import { gameEngine, EntityFactory, createTimer, type GameEngine } from '../Engine';
import { GAME_CONFIG } from '../../game/config';
import { gridToPixel } from '../gameUtils';
import {
  enemyQuery,
  playerQuery,
  type PlayerEntity
} from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';

/**
 * Enemy Spawn System
 * Manages sequential enemy spawning: Lizard → Spider → Frog (exactly 3 enemies)
 */

// Spawn state tracking variables
let currentSpawnIndex = 0;           // Track which enemy type to spawn next (0=lizard, 1=spider, 2=frog)
let totalEnemiesSpawned = 0;         // Track total spawned this cycle
let spawnCycleComplete = false;      // Track if all 3 enemies have been spawned

// Spawn order configuration
const SPAWN_ORDER: Array<'lizard' | 'spider' | 'frog'> = ['lizard', 'spider', 'frog'];

/**
 * Get the next enemy type to spawn based on current spawn index
 */
function getNextEnemyType(): 'lizard' | 'spider' | 'frog' | null {
  if (spawnCycleComplete || currentSpawnIndex >= SPAWN_ORDER.length) {
    return null;
  }
  return SPAWN_ORDER[currentSpawnIndex];
}

/**
 * Increment spawn index and update tracking variables
 */
function incrementSpawnIndex(): void {
  currentSpawnIndex++;
  totalEnemiesSpawned++;
  
  // Check if spawn cycle is complete (all 3 enemies spawned)
  if (currentSpawnIndex >= SPAWN_ORDER.length) {
    spawnCycleComplete = true;
    console.log('🔄 Spawn cycle complete - all 3 enemy types spawned');
  }
}

/**
 * Reset spawn cycle when all enemies are defeated
 */
function resetSpawnCycle(): void {
  currentSpawnIndex = 0;
  totalEnemiesSpawned = 0;
  spawnCycleComplete = false;
  console.log('🔄 Resetting spawn cycle - ready to spawn new enemy sequence');
}

/**
 * Check if spawn cycle should be reset based on current enemy count
 */
function shouldResetCycle(currentEnemyCount: number): boolean {
  return spawnCycleComplete && currentEnemyCount === 0;
}

// Add the enemy spawn system to ECSpresso
export function addEnemySpawnSystemToEngine(): void {
  gameEngine.addSystem('enemySpawnSystem')
    .setPriority(SYSTEM_PRIORITIES.ENEMY_SPAWN)
    .addQuery('enemies', enemyQuery)
    .addSingleton('player', { ...playerQuery, mutates: ['timers'] } as const)
    .setProcess(({ queries, ecs }) => {
      const player = queries.player;
      if (!player) return;

      const currentEnemyCount = queries.enemies.length;
      if (shouldResetCycle(currentEnemyCount)) {
        resetSpawnCycle();
      }

      if (spawnCycleComplete || currentEnemyCount >= GAME_CONFIG.ENEMY_SPAWN.MAX_ENEMIES) return;
      if (player.components.timers.enemySpawn?.active) return;

      const nextEnemyType = getNextEnemyType();
      if (!nextEnemyType) return;

      spawnEnemyFromEdge(ecs, nextEnemyType);
      incrementSpawnIndex();
      player.components.timers.enemySpawn = createTimer(calculateSpawnInterval(player) / 1000);
    });
}

const DIFFICULTY_SCALE_SCORE = 100;
const SPAWN_REDUCTION_PER_LEVEL = 500;

/**
 * Calculate spawn interval based on player score (difficulty scaling)
 */
function calculateSpawnInterval(player: PlayerEntity | undefined): number {
  if (!player) return GAME_CONFIG.TIMING.BASE_SPAWN_INTERVAL;

  const score = player.components.player.score;
  const difficultyLevel = Math.floor(score / DIFFICULTY_SCALE_SCORE);
  const adjusted = GAME_CONFIG.TIMING.BASE_SPAWN_INTERVAL - difficultyLevel * SPAWN_REDUCTION_PER_LEVEL;
  return Math.max(adjusted, GAME_CONFIG.TIMING.MIN_SPAWN_INTERVAL);
}

/**
 * Spawn a specific enemy type from a random edge position
 */
function spawnEnemyFromEdge(ecs: GameEngine, enemyType: 'lizard' | 'spider' | 'frog'): void {
  const edgePosition = getRandomEdgePosition();
  const pixelPos = gridToPixel(edgePosition.x, edgePosition.y);

  const behaviorTypes: Array<'chase' | 'patrol' | 'random' | 'guard'> = ['chase', 'random', 'patrol', 'guard'];
  const randomBehavior = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];

  EntityFactory.createEnemy(ecs.commands, pixelPos.x, pixelPos.y, enemyType, randomBehavior);

  console.log(`Spawned ${enemyType} (#${totalEnemiesSpawned + 1}/3) with ${randomBehavior} behavior at edge position (${edgePosition.x}, ${edgePosition.y})`);
}

/**
 * Get a random position on the edge of the grid
 */
function getRandomEdgePosition(): { x: number; y: number } {
  const edges = [];
  
  // Top edge
  for (let x = 0; x < GAME_CONFIG.GRID.WIDTH; x++) {
    edges.push({ x, y: 0 });
  }
  
  // Bottom edge
  for (let x = 0; x < GAME_CONFIG.GRID.WIDTH; x++) {
    edges.push({ x, y: GAME_CONFIG.GRID.HEIGHT - 1 });
  }
  
  // Left edge (excluding corners already added)
  for (let y = 1; y < GAME_CONFIG.GRID.HEIGHT - 1; y++) {
    edges.push({ x: 0, y });
  }
  
  // Right edge (excluding corners already added)
  for (let y = 1; y < GAME_CONFIG.GRID.HEIGHT - 1; y++) {
    edges.push({ x: GAME_CONFIG.GRID.WIDTH - 1, y });
  }
  
  // Return random edge position
  return edges[Math.floor(Math.random() * edges.length)];
} 
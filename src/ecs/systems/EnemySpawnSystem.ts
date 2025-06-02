import { gameEngine, EntityFactory } from '../Engine';
import { GRID_WIDTH, GRID_HEIGHT } from '../../game/config';
import { gridToPixel } from '../gameUtils';
import { 
  enemyQuery, 
  playerQuery,
  type PlayerEntity
} from '../queries';
import { ENEMY_SPAWN_CONFIG, SYSTEM_PRIORITIES } from '../systemConfigs';
import { calculateDifficultyInterval } from '../gameUtils';

/**
 * Enemy Spawn System
 * Manages sequential enemy spawning: Lizard → Spider → Frog (exactly 3 enemies)
 */

// Spawn state tracking variables
let lastSpawnTime = 0;
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
    return null; // No more enemies to spawn this cycle
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
    .addQuery('players', playerQuery)
    .setProcess((queries) => {
      const currentTime = performance.now();
      const currentEnemyCount = queries.enemies.length;
      
      // Check if we should reset the spawn cycle (all enemies defeated)
      if (shouldResetCycle(currentEnemyCount)) {
        resetSpawnCycle();
      }
      
      // Only spawn if cycle is not complete and enough time has passed
      if (!spawnCycleComplete && currentEnemyCount < ENEMY_SPAWN_CONFIG.MAX_ENEMIES) {
        const spawnInterval = calculateSpawnInterval(queries.players[0]);
        
        if (currentTime - lastSpawnTime > spawnInterval) {
          const nextEnemyType = getNextEnemyType();
          if (nextEnemyType) {
            spawnEnemyFromEdge(nextEnemyType);
            incrementSpawnIndex();
            lastSpawnTime = currentTime;
          }
        }
      }
    })
    .build();
}

/**
 * Calculate spawn interval based on player score (difficulty scaling)
 */
function calculateSpawnInterval(player: PlayerEntity): number {
  if (!player) return ENEMY_SPAWN_CONFIG.BASE_SPAWN_INTERVAL;
  
  const score = player.components.player.score;
  
  return calculateDifficultyInterval(
    ENEMY_SPAWN_CONFIG.BASE_SPAWN_INTERVAL,
    ENEMY_SPAWN_CONFIG.MIN_SPAWN_INTERVAL,
    ENEMY_SPAWN_CONFIG.DIFFICULTY_SCALE_SCORE,
    500, // Reduction per level
    score
  );
}

/**
 * Spawn a specific enemy type from a random edge position
 */
function spawnEnemyFromEdge(enemyType: 'lizard' | 'spider' | 'frog'): void {
  const edgePosition = getRandomEdgePosition();
  const pixelPos = gridToPixel(edgePosition.x, edgePosition.y);
  
  // Choose random behavior type
  const behaviorTypes: Array<'chase' | 'patrol' | 'random' | 'guard'> = ['chase', 'random', 'patrol', 'guard'];
  const randomBehavior = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
  
  // Spawn the specific enemy type
  EntityFactory.createEnemy(pixelPos.x, pixelPos.y, enemyType, randomBehavior);
  
  console.log(`Spawned ${enemyType} (#${totalEnemiesSpawned + 1}/3) with ${randomBehavior} behavior at edge position (${edgePosition.x}, ${edgePosition.y})`);
}

/**
 * Get a random position on the edge of the grid
 */
function getRandomEdgePosition(): { x: number; y: number } {
  const edges = [];
  
  // Top edge
  for (let x = 0; x < GRID_WIDTH; x++) {
    edges.push({ x, y: 0 });
  }
  
  // Bottom edge
  for (let x = 0; x < GRID_WIDTH; x++) {
    edges.push({ x, y: GRID_HEIGHT - 1 });
  }
  
  // Left edge (excluding corners already added)
  for (let y = 1; y < GRID_HEIGHT - 1; y++) {
    edges.push({ x: 0, y });
  }
  
  // Right edge (excluding corners already added)
  for (let y = 1; y < GRID_HEIGHT - 1; y++) {
    edges.push({ x: GRID_WIDTH - 1, y });
  }
  
  // Return random edge position
  return edges[Math.floor(Math.random() * edges.length)];
} 
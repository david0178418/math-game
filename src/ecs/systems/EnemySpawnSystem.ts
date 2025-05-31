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
 * Manages dynamic enemy spawning from grid edges with difficulty scaling
 */

let lastSpawnTime = 0;

// Add the enemy spawn system to ECSpresso
export function addEnemySpawnSystemToEngine(): void {
  gameEngine.addSystem('enemySpawnSystem')
    .setPriority(SYSTEM_PRIORITIES.ENEMY_SPAWN)
    .addQuery('enemies', enemyQuery)
    .addQuery('players', playerQuery)
    .setProcess((queries) => {
      const currentTime = performance.now();
      const currentEnemyCount = queries.enemies.length;
      
      // Only spawn if we haven't reached max enemies and enough time has passed
      if (currentEnemyCount < ENEMY_SPAWN_CONFIG.MAX_ENEMIES) {
        const spawnInterval = calculateSpawnInterval(queries.players[0]);
        
        if (currentTime - lastSpawnTime > spawnInterval) {
          spawnEnemyFromEdge();
          lastSpawnTime = currentTime;
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
 * Spawn an enemy from a random edge position
 */
function spawnEnemyFromEdge(): void {
  const edgePosition = getRandomEdgePosition();
  const pixelPos = gridToPixel(edgePosition.x, edgePosition.y);
  
  // Choose random behavior type
  const behaviorTypes: Array<'chase' | 'patrol' | 'random' | 'guard'> = ['chase', 'random', 'patrol', 'guard'];
  const randomBehavior = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
  
  EntityFactory.createEnemy(pixelPos.x, pixelPos.y, randomBehavior);
  
  console.log(`Spawned ${randomBehavior} enemy at edge position (${edgePosition.x}, ${edgePosition.y})`);
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
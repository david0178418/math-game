import { gameEngine } from '../Engine';
import { pixelToGrid, gridToPixel } from './MovementSystem';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE, GAME_CONFIG } from '../../game/config';
import { 
  enemyQuery, 
  playerQuery,
  type EnemyEntity,
  type PlayerEntity
} from '../queries';
import { AI_CONFIG, SYSTEM_PRIORITIES } from '../systemConfigs';
import { startMovementAnimation, isEntityAnimating } from './AnimationSystem';
import { createSpiderWeb } from './SpiderWebSystem';
import { initializeFrogTongue } from './FrogTongueSystem';

/**
 * AI System
 * Handles AI behavior for enemy entities using grid-based movement like Number Munchers
 */

// Use centralized enemy type configurations
const SPIDER_CONFIG = GAME_CONFIG.ENEMY_TYPES.SPIDER;

// Define obstacle query locally since it's specific to AI system
const obstacleQuery = {
  with: ['position', 'collider']
} as const;

type ObstacleEntity = { 
  id: number; 
  components: { 
    position: { x: number; y: number };
    collider: { width: number; height: number; group: string };
  };
};

// AI behavior types
export type AIBehaviorType = 'chase' | 'patrol' | 'random' | 'guard';

// AI state for pathfinding
interface AIState {
  targetGridX: number;
  targetGridY: number;
  path: Array<{ x: number, y: number }>;
  pathIndex: number;
  lastPathUpdate: number;
}

// Add the AI system to ECSpresso
export function addAISystemToEngine(): void {
  gameEngine.addSystem('aiSystem')
    .setPriority(SYSTEM_PRIORITIES.AI)
    .addQuery('enemies', enemyQuery)
    .addQuery('players', playerQuery)
    .addQuery('obstacles', obstacleQuery)
    .setProcess((queries) => {
      const currentTime = Date.now();
      const enemies = queries.enemies;
      const players = queries.players;
      const obstacles = queries.obstacles;
      
      // Skip if no player exists
      if (players.length === 0) return;
      
      const player = players[0]; // Use first player for AI targeting
      
      // Process each enemy
      for (const enemy of enemies) {
        // Skip if enemy is currently animating (prevent movement during transitions)
        if (isEntityAnimating(enemy.components.position)) {
          continue;
        }
        
        processEnemyAI(enemy, player, obstacles, enemies, currentTime);
      }
    })
    .build();
}

/**
 * Process AI behavior for a single enemy
 */
function processEnemyAI(
  enemy: EnemyEntity,
  player: PlayerEntity,
  obstacles: ObstacleEntity[],
  allEnemies: EnemyEntity[],
  currentTime: number
): void {
  const enemyPos = enemy.components.position;
  const enemyData = enemy.components.enemy;
  
  // Frog-specific behavior: Don't move if tongue is extended
  if (enemyData.enemyType === 'frog') {
    const frogTongue = gameEngine.entityManager.getComponent(enemy.id, 'frogTongue');
    
    // Initialize frog tongue if it doesn't exist
    if (!frogTongue) {
      initializeFrogTongue(enemy.id);
    } else if (frogTongue.isExtended) {
      // Frog can't move while tongue is out
      console.log(`🐸 Frog ${enemy.id} cannot move - tongue is extended`);
      return;
    }
  }
  
  // Check if it's time for this enemy to move
  if (currentTime < enemyData.nextMoveTime) {
    return; // Not time to move yet
  }
  
  // Initialize AI state if not present
  if (!enemyData.aiState) {
    const currentGrid = pixelToGrid(enemyPos.x, enemyPos.y);
    enemyData.aiState = {
      targetGridX: currentGrid.x,
      targetGridY: currentGrid.y,
      path: [],
      pathIndex: 0,
      lastPathUpdate: 0
    };
  }
  
  const aiState = enemyData.aiState;
  
  // Determine next move based on behavior type
  let nextGridX = Math.round(enemyPos.x / CELL_SIZE);
  let nextGridY = Math.round(enemyPos.y / CELL_SIZE);
  let moveInterval: number = calculateMoveInterval(enemyData.behaviorType, player, enemyData.enemyType);
  
  switch (enemyData.behaviorType) {
    case 'chase': {
      const result = processChaseAI(enemy, player, obstacles, allEnemies, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
      break;
    }
    case 'patrol': {
      const result = processPatrolAI(enemy, obstacles, allEnemies, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
      break;
    }
    case 'random': {
      const result = processRandomAI(enemy, obstacles, allEnemies, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
      break;
    }
    case 'guard': {
      const result = processGuardAI(enemy, obstacles, allEnemies, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
      break;
    }
    default: {
      const result = processRandomAI(enemy, obstacles, allEnemies, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
    }
  }
  
  // Apply the movement using smooth animation (convert grid to pixel coordinates)
  const newPixelPos = gridToPixel(nextGridX, nextGridY);
  
  // Only animate if position actually changed
  if (newPixelPos.x !== enemyPos.x || newPixelPos.y !== enemyPos.y) {
    startMovementAnimation(enemyPos, newPixelPos.x, newPixelPos.y);
  }
  
  // Spider-specific behavior: place web at previous position with some probability
  if (enemyData.enemyType === 'spider' && 
      (newPixelPos.x !== enemyPos.x || newPixelPos.y !== enemyPos.y)) {
    
    console.log(`🕷️ Spider moved from (${enemyPos.x}, ${enemyPos.y}) to (${newPixelPos.x}, ${newPixelPos.y})`);
    
    // Use configured chance to place a web when moving
    if (Math.random() < SPIDER_CONFIG.WEB_PLACEMENT_CHANCE) {
      const oldGridPos = pixelToGrid(enemyPos.x, enemyPos.y);
      
      console.log(`🕷️ Attempting to place web at grid (${oldGridPos.x}, ${oldGridPos.y})`);
      
      // Check if position is valid for web placement (not occupied by other entities)
      if (isValidWebPosition(oldGridPos.x, oldGridPos.y, allEnemies, player, enemy)) {
        createSpiderWeb(oldGridPos.x, oldGridPos.y);
        console.log(`🕸️ SUCCESS: Web placed at grid (${oldGridPos.x}, ${oldGridPos.y})`);
      } else {
        console.log(`❌ BLOCKED: Cannot place web at grid (${oldGridPos.x}, ${oldGridPos.y}) - position occupied`);
      }
    }
  }
  
  // Set next move time with some randomization
  const baseInterval = moveInterval;
  const randomVariation = baseInterval * 0.2; // ±20% variation
  const variation = (Math.random() - 0.5) * randomVariation;
  enemyData.nextMoveTime = currentTime + baseInterval + variation;
}

/**
 * Calculate move interval based on behavior type and player score (difficulty)
 */
function calculateMoveInterval(behaviorType: AIBehaviorType, player: PlayerEntity, enemyType?: 'lizard' | 'spider' | 'frog'): number {
  const score = player?.components?.player?.score || 0;
  
  // Scale difficulty based on score
  const difficultyLevel = Math.floor(score / AI_CONFIG.DIFFICULTY_SCALE_SCORE);
  const reductionFactor = Math.min(difficultyLevel * 0.1, 0.7); // Max 70% reduction
  
  // Calculate difficulty-adjusted interval
  const intervalRange = AI_CONFIG.BASE_MOVE_INTERVAL - AI_CONFIG.MIN_MOVE_INTERVAL;
  const difficultyAdjustedInterval = AI_CONFIG.BASE_MOVE_INTERVAL - (intervalRange * reductionFactor);
  
  // Apply behavior-specific multipliers
  let multiplier: number;
  switch (behaviorType) {
    case 'chase':
      multiplier = AI_CONFIG.CHASE_SPEED_MULTIPLIER;
      break;
    case 'patrol':
      multiplier = AI_CONFIG.PATROL_SPEED_MULTIPLIER;
      break;
    case 'random':
      multiplier = AI_CONFIG.RANDOM_SPEED_MULTIPLIER;
      break;
    case 'guard':
      multiplier = AI_CONFIG.GUARD_SPEED_MULTIPLIER;
      break;
    default:
      multiplier = AI_CONFIG.RANDOM_SPEED_MULTIPLIER;
  }
  
  // Apply enemy type-specific speed multipliers
  if (enemyType) {
    const typeMultiplier = AI_CONFIG.ENEMY_SPEED_MULTIPLIERS[enemyType.toUpperCase() as keyof typeof AI_CONFIG.ENEMY_SPEED_MULTIPLIERS] || 1.0;
    multiplier *= typeMultiplier;
  }
  
  return Math.round(difficultyAdjustedInterval * multiplier);
}

/**
 * Chase AI: Follows the player using pathfinding
 */
function processChaseAI(
  enemy: EnemyEntity,
  player: PlayerEntity,
  obstacles: ObstacleEntity[],
  allEnemies: EnemyEntity[],
  currentTime: number,
  aiState: AIState
): { x: number, y: number } {
  const enemyPos = enemy.components.position;
  const playerPos = player.components.position;
  
  // Convert positions to grid coordinates
  const enemyGrid = pixelToGrid(enemyPos.x, enemyPos.y);
  const playerGrid = pixelToGrid(playerPos.x, playerPos.y);
  
  // Check if player is within detection range
  const distance = Math.abs(enemyGrid.x - playerGrid.x) + Math.abs(enemyGrid.y - playerGrid.y);
  if (distance > AI_CONFIG.DETECTION_RANGE) {
    // Player too far, switch to random movement
    return processRandomAI(enemy, obstacles, allEnemies, currentTime, aiState);
  }
  
  // Simple chase: move one step towards player
  let nextX = enemyGrid.x;
  let nextY = enemyGrid.y;
  
  // Move horizontally first, then vertically (prevents diagonal movement)
  if (enemyGrid.x < playerGrid.x) {
    nextX = Math.min(GRID_WIDTH - 1, enemyGrid.x + 1);
  } else if (enemyGrid.x > playerGrid.x) {
    nextX = Math.max(0, enemyGrid.x - 1);
  } else if (enemyGrid.y < playerGrid.y) {
    nextY = Math.min(GRID_HEIGHT - 1, enemyGrid.y + 1);
  } else if (enemyGrid.y > playerGrid.y) {
    nextY = Math.max(0, enemyGrid.y - 1);
  }
  
  // Check if the target position is valid (not occupied by obstacles or other enemies)
  if (!isPositionBlocked(nextX, nextY, obstacles, allEnemies, enemy)) {
    return { x: nextX, y: nextY };
  }
  
  // If blocked, try alternative directions
  const alternatives = getAlternativeDirections(enemyGrid, playerGrid);
  for (const alt of alternatives) {
    if (!isPositionBlocked(alt.x, alt.y, obstacles, allEnemies, enemy)) {
      return { x: alt.x, y: alt.y };
    }
  }
  
  // If all directions blocked, stay in place
  return { x: enemyGrid.x, y: enemyGrid.y };
}

/**
 * Patrol AI: Moves between predefined waypoints
 */
function processPatrolAI(
  enemy: EnemyEntity,
  obstacles: ObstacleEntity[],
  allEnemies: EnemyEntity[],
  _currentTime: number,
  _aiState: AIState
): { x: number, y: number } {
  const enemyData = enemy.components.enemy;
  const currentGrid = pixelToGrid(enemy.components.position.x, enemy.components.position.y);
  
  // If no waypoints defined, create some
  if (!enemyData.waypoints || enemyData.waypoints.length === 0) {
    enemyData.waypoints = generatePatrolWaypoints(currentGrid);
    enemyData.currentWaypoint = 0;
  }
  
  const waypoints = enemyData.waypoints;
  const currentWaypointIndex = enemyData.currentWaypoint ?? 0;
  const targetWaypoint = waypoints[currentWaypointIndex];
  
  // Move towards current waypoint
  const direction = getDirectionToTarget(currentGrid, targetWaypoint);
  let nextX = currentGrid.x + direction.x;
  let nextY = currentGrid.y + direction.y;
  
  // Clamp to grid boundaries
  nextX = Math.max(0, Math.min(GRID_WIDTH - 1, nextX));
  nextY = Math.max(0, Math.min(GRID_HEIGHT - 1, nextY));
  
  // Check if target position is blocked by other enemies
  if (isPositionBlocked(nextX, nextY, obstacles, allEnemies, enemy)) {
    // Try alternative directions if blocked
    const alternatives = [
      { x: currentGrid.x + 1, y: currentGrid.y },
      { x: currentGrid.x - 1, y: currentGrid.y },
      { x: currentGrid.x, y: currentGrid.y + 1 },
      { x: currentGrid.x, y: currentGrid.y - 1 }
    ];
    
    for (const alt of alternatives) {
      if (alt.x >= 0 && alt.x < GRID_WIDTH && alt.y >= 0 && alt.y < GRID_HEIGHT &&
          !isPositionBlocked(alt.x, alt.y, obstacles, allEnemies, enemy)) {
        nextX = alt.x;
        nextY = alt.y;
        break;
      }
    }
    
    // If all alternatives blocked, stay in place
    if (isPositionBlocked(nextX, nextY, obstacles, allEnemies, enemy)) {
      nextX = currentGrid.x;
      nextY = currentGrid.y;
    }
  }
  
  // Check if reached waypoint
  if (nextX === targetWaypoint.x && nextY === targetWaypoint.y) {
    enemyData.currentWaypoint = (currentWaypointIndex + 1) % waypoints.length;
  }
  
  return { x: nextX, y: nextY };
}

/**
 * Random AI: Moves in random directions
 */
function processRandomAI(
  enemy: EnemyEntity,
  obstacles: ObstacleEntity[],
  allEnemies: EnemyEntity[],
  _currentTime: number,
  _aiState: AIState
): { x: number, y: number } {
  const currentGrid = pixelToGrid(enemy.components.position.x, enemy.components.position.y);
  
  // Random direction
  const directions = [
    { x: 0, y: -1 }, // Up
    { x: 0, y: 1 },  // Down
    { x: -1, y: 0 }, // Left
    { x: 1, y: 0 },  // Right
    { x: 0, y: 0 },  // Stay in place (25% chance)
  ];
  
  const randomDir = directions[Math.floor(Math.random() * directions.length)];
  let nextX = Math.max(0, Math.min(GRID_WIDTH - 1, currentGrid.x + randomDir.x));
  let nextY = Math.max(0, Math.min(GRID_HEIGHT - 1, currentGrid.y + randomDir.y));
  
  // If the chosen position is blocked, stay in place
  if (isPositionBlocked(nextX, nextY, obstacles, allEnemies, enemy)) {
    nextX = currentGrid.x;
    nextY = currentGrid.y;
  }
  
  return { x: nextX, y: nextY };
}

/**
 * Guard AI: Stays near a specific position
 */
function processGuardAI(
  enemy: EnemyEntity,
  obstacles: ObstacleEntity[],
  allEnemies: EnemyEntity[],
  _currentTime: number,
  _aiState: AIState
): { x: number, y: number } {
  const enemyData = enemy.components.enemy;
  const currentGrid = pixelToGrid(enemy.components.position.x, enemy.components.position.y);
  
  // Set guard position if not defined
  if (!enemyData.guardPosition) {
    enemyData.guardPosition = { x: currentGrid.x, y: currentGrid.y };
  }
  
  const guardPos = enemyData.guardPosition;
  const distance = Math.abs(currentGrid.x - guardPos.x) + Math.abs(currentGrid.y - guardPos.y);
  
  // If too far from guard position, move back towards it
  if (distance > 2) { // 2 grid cells
    const direction = getDirectionToTarget(currentGrid, guardPos);
    let nextX = Math.max(0, Math.min(GRID_WIDTH - 1, currentGrid.x + direction.x));
    let nextY = Math.max(0, Math.min(GRID_HEIGHT - 1, currentGrid.y + direction.y));
    
    // Check if position is blocked by other enemies
    if (isPositionBlocked(nextX, nextY, obstacles, allEnemies, enemy)) {
      // Try alternative directions
      const alternatives = [
        { x: currentGrid.x + 1, y: currentGrid.y },
        { x: currentGrid.x - 1, y: currentGrid.y },
        { x: currentGrid.x, y: currentGrid.y + 1 },
        { x: currentGrid.x, y: currentGrid.y - 1 }
      ];
      
      for (const alt of alternatives) {
        if (alt.x >= 0 && alt.x < GRID_WIDTH && alt.y >= 0 && alt.y < GRID_HEIGHT &&
            !isPositionBlocked(alt.x, alt.y, obstacles, allEnemies, enemy)) {
          nextX = alt.x;
          nextY = alt.y;
          break;
        }
      }
      
      // If all alternatives blocked, stay in place
      if (isPositionBlocked(nextX, nextY, obstacles, allEnemies, enemy)) {
        nextX = currentGrid.x;
        nextY = currentGrid.y;
      }
    }
    
    return { x: nextX, y: nextY };
  } else {
    // Stay near guard position, occasional small movements
    const shouldMove = Math.random() < 0.3; // 30% chance to move
    if (shouldMove) {
      const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      const randomDir = directions[Math.floor(Math.random() * directions.length)];
      let nextX = Math.max(0, Math.min(GRID_WIDTH - 1, currentGrid.x + randomDir.x));
      let nextY = Math.max(0, Math.min(GRID_HEIGHT - 1, currentGrid.y + randomDir.y));
      
      // Only move if it keeps us close to guard position and isn't blocked
      const newDistance = Math.abs(nextX - guardPos.x) + Math.abs(nextY - guardPos.y);
      if (newDistance <= 2 && !isPositionBlocked(nextX, nextY, obstacles, allEnemies, enemy)) {
        return { x: nextX, y: nextY };
      }
    }
    // Stay in place
    return { x: currentGrid.x, y: currentGrid.y };
  }
}

/**
 * Check if a grid position is blocked by obstacles or other enemies
 */
function isPositionBlocked(
  gridX: number, 
  gridY: number, 
  _obstacles: ObstacleEntity[], 
  allEnemies: EnemyEntity[], 
  currentEnemy: EnemyEntity
): boolean {
  // Check boundaries
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
    return true;
  }
  
  // Check if another enemy is already at this position
  for (const otherEnemy of allEnemies) {
    // Skip self
    if (otherEnemy.id === currentEnemy.id) continue;
    
    // Get the other enemy's grid position
    const otherPos = otherEnemy.components.position;
    const otherGridX = Math.round(otherPos.x / CELL_SIZE);
    const otherGridY = Math.round(otherPos.y / CELL_SIZE);
    
    // Check if positions match
    if (otherGridX === gridX && otherGridY === gridY) {
      return true;
    }
  }
  
  // Future: Check obstacles here when implemented
  // for (const obstacle of obstacles) { ... }
  
  return false;
}

/**
 * Get direction vector towards target (returns -1, 0, or 1 for each axis)
 */
function getDirectionToTarget(
  from: { x: number, y: number }, 
  to: { x: number, y: number }
): { x: number, y: number } {
  return {
    x: from.x < to.x ? 1 : (from.x > to.x ? -1 : 0),
    y: from.y < to.y ? 1 : (from.y > to.y ? -1 : 0)
  };
}

/**
 * Get alternative directions when primary path is blocked
 */
function getAlternativeDirections(
  from: { x: number, y: number },
  to: { x: number, y: number }
): Array<{ x: number, y: number }> {
  const alternatives = [];
  
  // If trying to move horizontally, try vertical directions
  if (from.x !== to.x) {
    if (from.y > 0) alternatives.push({ x: from.x, y: from.y - 1 });
    if (from.y < GRID_HEIGHT - 1) alternatives.push({ x: from.x, y: from.y + 1 });
  }
  
  // If trying to move vertically, try horizontal directions
  if (from.y !== to.y) {
    if (from.x > 0) alternatives.push({ x: from.x - 1, y: from.y });
    if (from.x < GRID_WIDTH - 1) alternatives.push({ x: from.x + 1, y: from.y });
  }
  
  return alternatives;
}

/**
 * Check if a grid position is valid for placing a spider web
 */
function isValidWebPosition(
  gridX: number, 
  gridY: number, 
  allEnemies: EnemyEntity[], 
  player: PlayerEntity,
  currentEnemy: EnemyEntity
): boolean {
  console.log(`🔍 Checking web position validity for grid (${gridX}, ${gridY})`);
  
  // Check boundaries
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
    console.log(`❌ Position (${gridX}, ${gridY}) is outside grid boundaries`);
    return false;
  }
  
  // Check if player is at this position
  const playerGridPos = pixelToGrid(player.components.position.x, player.components.position.y);
  console.log(`👤 Player is at grid (${playerGridPos.x}, ${playerGridPos.y})`);
  if (playerGridPos.x === gridX && playerGridPos.y === gridY) {
    console.log(`❌ Position (${gridX}, ${gridY}) is occupied by player`);
    return false;
  }
  
  // Check if any OTHER enemy is at this position (exclude the current spider)
  for (const enemy of allEnemies) {
    // Skip the current enemy (spider placing the web)
    if (enemy.id === currentEnemy.id) {
      console.log(`🕷️ Skipping current spider (${enemy.id}) from collision check`);
      continue;
    }
    
    const enemyGridPos = pixelToGrid(enemy.components.position.x, enemy.components.position.y);
    console.log(`👾 Enemy ${enemy.id} (${enemy.components.enemy.enemyType}) is at grid (${enemyGridPos.x}, ${enemyGridPos.y})`);
    if (enemyGridPos.x === gridX && enemyGridPos.y === gridY) {
      console.log(`❌ Position (${gridX}, ${gridY}) is occupied by enemy ${enemy.id} (${enemy.components.enemy.enemyType})`);
      return false;
    }
  }
  
  console.log(`✅ Position (${gridX}, ${gridY}) is valid for web placement`);
  // Position is valid for web placement
  return true;
}

/**
 * Generate patrol waypoints around a starting position
 */
function generatePatrolWaypoints(startPos: { x: number, y: number }): Array<{ x: number, y: number }> {
  const size = 3; // Patrol area size
  return [
    { x: startPos.x, y: startPos.y },
    { x: Math.min(GRID_WIDTH - 1, startPos.x + size), y: startPos.y },
    { x: Math.min(GRID_WIDTH - 1, startPos.x + size), y: Math.min(GRID_HEIGHT - 1, startPos.y + size) },
    { x: startPos.x, y: Math.min(GRID_HEIGHT - 1, startPos.y + size) },
  ];
} 
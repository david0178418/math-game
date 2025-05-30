import { gameEngine } from '../Engine';
import { pixelToGrid, gridToPixel } from './MovementSystem';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../../game/config';
import { createQueryDefinition, type QueryResultEntity } from 'ecspresso';

// Import Components type from Engine for use with QueryResultEntity
import type { Components } from '../Engine';

/**
 * AI System
 * Handles AI behavior for enemy entities using grid-based movement like Number Munchers
 */

// Create reusable query definitions
const enemyQuery = createQueryDefinition({
  with: ['position', 'enemy']
});

const playerQuery = createQueryDefinition({
  with: ['position', 'player']
});

const obstacleQuery = createQueryDefinition({
  with: ['position', 'collider']
});

// Extract entity types using ECSpresso utilities
type EnemyEntity = QueryResultEntity<Components, typeof enemyQuery>;
type PlayerEntity = QueryResultEntity<Components, typeof playerQuery>;
type ObstacleEntity = QueryResultEntity<Components, typeof obstacleQuery>;

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

// Configuration for AI behavior
const AI_CONFIG = {
  BASE_MOVE_INTERVAL: 1500,       // Base milliseconds between enemy moves (slowed down)
  MIN_MOVE_INTERVAL: 800,         // Minimum move interval (fastest)
  PATH_UPDATE_INTERVAL: 2000,     // Update pathfinding every 2 seconds
  DETECTION_RANGE: 6,             // Grid cells within which AI detects player
  CHASE_SPEED_MULTIPLIER: 0.8,    // Chase moves slightly faster
  PATROL_SPEED_MULTIPLIER: 1.2,   // Patrol moves slower
  RANDOM_SPEED_MULTIPLIER: 1.0,   // Random normal speed
  GUARD_SPEED_MULTIPLIER: 1.5,    // Guard moves slowest
  DIFFICULTY_SCALE_SCORE: 100,    // Score points per difficulty increase
};

// Add the AI system to ECSpresso
export function addAISystemToEngine(): void {
  gameEngine.addSystem('aiSystem')
    .setPriority(85) // After input, before movement
    .addQuery('enemies', enemyQuery)
    .addQuery('players', playerQuery)
    .addQuery('obstacles', obstacleQuery)
    .setProcess((queries) => {
      const currentTime = performance.now();
      
      // Process each enemy
      for (const enemy of queries.enemies) {
        const player = queries.players[0]; // Assume single player
        if (player) {
          processEnemyAI(enemy, player, queries.obstacles, currentTime);
        }
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
  currentTime: number
): void {
  const enemyPos = enemy.components.position;
  const enemyData = enemy.components.enemy;
  
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
    } as AIState;
  }
  
  const aiState = enemyData.aiState as AIState;
  
  // Determine next move based on behavior type
  let nextGridX = Math.round(enemyPos.x / CELL_SIZE);
  let nextGridY = Math.round(enemyPos.y / CELL_SIZE);
  let moveInterval: number = calculateMoveInterval(enemyData.behaviorType, player);
  
  switch (enemyData.behaviorType) {
    case 'chase': {
      const result = processChaseAI(enemy, player, obstacles, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
      break;
    }
    case 'patrol': {
      const result = processPatrolAI(enemy, obstacles, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
      break;
    }
    case 'random': {
      const result = processRandomAI(enemy, obstacles, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
      break;
    }
    case 'guard': {
      const result = processGuardAI(enemy, obstacles, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
      break;
    }
    default: {
      const result = processRandomAI(enemy, obstacles, currentTime, aiState);
      nextGridX = result.x;
      nextGridY = result.y;
    }
  }
  
  // Apply the movement (convert grid to pixel coordinates)
  const newPixelPos = gridToPixel(nextGridX, nextGridY);
  enemyPos.x = newPixelPos.x;
  enemyPos.y = newPixelPos.y;
  
  // Set next move time
  enemyData.nextMoveTime = currentTime + moveInterval;
}

/**
 * Calculate move interval based on behavior type and player score (difficulty)
 */
function calculateMoveInterval(behaviorType: AIBehaviorType, player: PlayerEntity): number {
  const score = player?.components?.player?.score || 0;
  const difficultyLevel = Math.floor(score / AI_CONFIG.DIFFICULTY_SCALE_SCORE);
  
  // Calculate base interval with difficulty scaling
  const baseInterval = AI_CONFIG.BASE_MOVE_INTERVAL - (difficultyLevel * 100);
  const difficultyAdjustedInterval = Math.max(baseInterval, AI_CONFIG.MIN_MOVE_INTERVAL);
  
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
  
  return Math.round(difficultyAdjustedInterval * multiplier);
}

/**
 * Chase AI: Follows the player using pathfinding
 */
function processChaseAI(
  enemy: EnemyEntity,
  player: PlayerEntity,
  obstacles: ObstacleEntity[],
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
    return processRandomAI(enemy, obstacles, currentTime, aiState);
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
  
  // Check if the target position is valid (not occupied by obstacles)
  if (!isPositionBlocked(nextX, nextY, obstacles)) {
    return { x: nextX, y: nextY };
  }
  
  // If blocked, try alternative directions
  const alternatives = getAlternativeDirections(enemyGrid, playerGrid);
  for (const alt of alternatives) {
    if (!isPositionBlocked(alt.x, alt.y, obstacles)) {
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
  _obstacles: ObstacleEntity[],
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
  _obstacles: ObstacleEntity[],
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
  if (isPositionBlocked(nextX, nextY, _obstacles)) {
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
  _obstacles: ObstacleEntity[],
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
    const nextX = Math.max(0, Math.min(GRID_WIDTH - 1, currentGrid.x + direction.x));
    const nextY = Math.max(0, Math.min(GRID_HEIGHT - 1, currentGrid.y + direction.y));
    return { x: nextX, y: nextY };
  } else {
    // Stay near guard position, occasional small movements
    const shouldMove = Math.random() < 0.3; // 30% chance to move
    if (shouldMove) {
      const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      const randomDir = directions[Math.floor(Math.random() * directions.length)];
      const nextX = Math.max(0, Math.min(GRID_WIDTH - 1, currentGrid.x + randomDir.x));
      const nextY = Math.max(0, Math.min(GRID_HEIGHT - 1, currentGrid.y + randomDir.y));
      
      // Only move if it keeps us close to guard position
      const newDistance = Math.abs(nextX - guardPos.x) + Math.abs(nextY - guardPos.y);
      if (newDistance <= 2) {
        return { x: nextX, y: nextY };
      }
    }
    // Stay in place
    return { x: currentGrid.x, y: currentGrid.y };
  }
}

/**
 * Check if a grid position is blocked by obstacles
 */
function isPositionBlocked(gridX: number, gridY: number, _obstacles: ObstacleEntity[]): boolean {
  // For now, only check boundaries (no obstacle collision implemented yet)
  return gridX < 0 || gridX >= GRID_WIDTH || 
         gridY < 0 || gridY >= GRID_HEIGHT;
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
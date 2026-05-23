import { gameEngine, type GameEngine } from '../Engine';
import { createTimer } from 'ecspresso/plugins/scripting/timers';
import { createNavGrid, findPath, type NavGrid } from 'ecspresso/plugins/ai/pathfinding';
import { pixelToGrid, gridToPixel } from '../gameUtils';
import { GAME_CONFIG } from '../../config';
import type { AIBehavior, EnemyType } from '../../types/shared';
import {
  enemyQuery,
  playerQuery,
  type EnemyEntity,
  type PlayerEntity
} from '../queries';
import { AI_CONFIG, SYSTEM_PRIORITIES } from '../systemConfigs';
import { startGridMovement, isEntityAnimating } from './AnimationSystem';
import { createSpiderWeb } from './SpiderWebSystem';
import { isFrogAttacking } from './FrogTongueSystem';
import { startFrogGridMovement } from './FrogSpriteSystem';

const SPIDER_CONFIG = GAME_CONFIG.ENEMY_TYPES.spider;

const navGrid: NavGrid = createNavGrid({
  width: GAME_CONFIG.GRID.WIDTH,
  height: GAME_CONFIG.GRID.HEIGHT,
  cellSize: GAME_CONFIG.GRID.CELL_SIZE,
});

const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 0 },
] as const;

const BEHAVIOR_MULTIPLIERS: Record<AIBehavior, number> = {
  chase: AI_CONFIG.CHASE_SPEED_MULTIPLIER,
  patrol: AI_CONFIG.PATROL_SPEED_MULTIPLIER,
  random: AI_CONFIG.RANDOM_SPEED_MULTIPLIER,
  guard: AI_CONFIG.GUARD_SPEED_MULTIPLIER,
};

const ENEMY_TYPE_MULTIPLIERS: Record<EnemyType, number> = {
  lizard: AI_CONFIG.ENEMY_SPEED_MULTIPLIERS.lizard,
  spider: AI_CONFIG.ENEMY_SPEED_MULTIPLIERS.spider,
  frog: AI_CONFIG.ENEMY_SPEED_MULTIPLIERS.frog,
};

const GUARD_RADIUS = 2;
const GUARD_MOVE_CHANCE = 0.3;

const cellOf = (entity: { components: { position: { x: number; y: number } } }): number => {
  const { x, y } = pixelToGrid(entity.components.position.x, entity.components.position.y);
  return navGrid.cellFromXY(x, y);
};

/**
 * Next grid step from `startCell` toward `goalCell` using A*, respecting `blocked`.
 * `startCell` is always passable to A* (per pathfinding contract) even when in `blocked`.
 */
function nextStepTowards(
  startCell: number,
  goalCell: number,
  blocked: Set<number>
): { x: number; y: number } {
  if (startCell === goalCell) return navGrid.cellToXY(startCell);
  const path = findPath(navGrid, startCell, goalCell, { blockedCells: blocked });
  if (!path || path.length < 2) return navGrid.cellToXY(startCell);
  return navGrid.cellToXY(path[1]);
}

interface AIContext {
  enemy: EnemyEntity;
  player: PlayerEntity;
  currentGrid: { x: number; y: number };
  startCell: number;
  blocked: Set<number>;
}

const AI_PROCESSORS: Record<AIBehavior, (ctx: AIContext) => { x: number; y: number }> = {
  chase: processChaseAI,
  patrol: processPatrolAI,
  random: processRandomAI,
  guard: processGuardAI,
};

export function addAISystemToEngine(): void {
  gameEngine.addSystem('aiSystem')
    .setPriority(SYSTEM_PRIORITIES.AI)
    .inPhase('preUpdate')
    .addQuery('enemies', { ...enemyQuery, optional: ['frogTongue'], mutates: ['enemy', 'timers'] } as const)
    .addSingleton('player', playerQuery)
    .setProcess(({ queries, ecs }) => {
      const { enemies, player } = queries;
      if (!player) return;

      // Shared per-frame blocker set: all enemy cells. A* treats each enemy's
      // own start cell as passable, so no per-enemy filtering needed.
      const blocked = new Set(enemies.map(cellOf));

      for (const enemy of enemies) {
        if (isEntityAnimating(ecs, enemy.id)) continue;
        if (isFrogAttacking(enemy.components.frogTongue)) continue;
        processEnemyAI(ecs, enemy, player, blocked);
      }
    });
}

function processEnemyAI(
  ecs: GameEngine,
  enemy: EnemyEntity,
  player: PlayerEntity,
  blocked: Set<number>
): void {
  const enemyPos = enemy.components.position;
  const enemyData = enemy.components.enemy;
  const timers = enemy.components.timers;

  if (timers.enemyMove?.active) return;

  const currentGrid = pixelToGrid(enemyPos.x, enemyPos.y);
  const startCell = navGrid.cellFromXY(currentGrid.x, currentGrid.y);

  const { x: nextGridX, y: nextGridY } = AI_PROCESSORS[enemyData.behaviorType]({
    enemy, player, currentGrid, startCell, blocked,
  });

  const newPixelPos = gridToPixel(nextGridX, nextGridY);
  const moved = newPixelPos.x !== enemyPos.x || newPixelPos.y !== enemyPos.y;

  if (moved) {
    if (enemyData.enemyType === 'frog') {
      startFrogGridMovement(ecs, enemy.id, currentGrid, { x: nextGridX, y: nextGridY }, newPixelPos.x, newPixelPos.y);
    } else {
      startGridMovement(ecs, enemy.id, newPixelPos.x, newPixelPos.y);
    }
  }

  if (enemyData.enemyType === 'spider' && moved &&
      Math.random() < SPIDER_CONFIG.WEB_PLACEMENT_CHANCE) {
    // The spider has vacated startCell, so the only thing that could occupy
    // it is the player.
    if (startCell !== cellOf(player)) {
      createSpiderWeb(ecs, currentGrid.x, currentGrid.y);
    }
  }

  const moveInterval = calculateMoveInterval(enemyData.behaviorType, player, enemyData.enemyType);
  const variation = (Math.random() - 0.5) * moveInterval * 0.2;
  timers.enemyMove = createTimer((moveInterval + variation) / 1000);
}

function calculateMoveInterval(behaviorType: AIBehavior, player: PlayerEntity, enemyType: EnemyType): number {
  const score = player.components.player.score;
  const difficultyLevel = Math.floor(score / AI_CONFIG.DIFFICULTY_SCALE_SCORE);
  const reductionFactor = Math.min(difficultyLevel * 0.1, 0.7);

  const intervalRange = AI_CONFIG.BASE_MOVE_INTERVAL - AI_CONFIG.MIN_MOVE_INTERVAL;
  const adjustedInterval = AI_CONFIG.BASE_MOVE_INTERVAL - (intervalRange * reductionFactor);
  const multiplier = BEHAVIOR_MULTIPLIERS[behaviorType] * ENEMY_TYPE_MULTIPLIERS[enemyType];

  return Math.round(adjustedInterval * multiplier);
}

function processChaseAI({ player, currentGrid, startCell, blocked, enemy }: AIContext): { x: number; y: number } {
  const playerGrid = pixelToGrid(player.components.position.x, player.components.position.y);
  const distance = Math.abs(currentGrid.x - playerGrid.x) + Math.abs(currentGrid.y - playerGrid.y);

  if (distance > AI_CONFIG.DETECTION_RANGE) {
    return processRandomAI({ enemy, player, currentGrid, startCell, blocked });
  }

  return nextStepTowards(startCell, navGrid.cellFromXY(playerGrid.x, playerGrid.y), blocked);
}

function processPatrolAI({ enemy, currentGrid, startCell, blocked }: AIContext): { x: number; y: number } {
  const enemyData = enemy.components.enemy;

  if (!enemyData.waypoints || enemyData.waypoints.length === 0) {
    enemyData.waypoints = generatePatrolWaypoints(currentGrid);
    enemyData.currentWaypoint = 0;
  }

  const waypoints = enemyData.waypoints;
  const waypointIndex = enemyData.currentWaypoint ?? 0;
  const target = waypoints[waypointIndex];

  if (currentGrid.x === target.x && currentGrid.y === target.y) {
    enemyData.currentWaypoint = (waypointIndex + 1) % waypoints.length;
    return currentGrid;
  }

  return nextStepTowards(startCell, navGrid.cellFromXY(target.x, target.y), blocked);
}

function processRandomAI({ currentGrid, blocked }: AIContext): { x: number; y: number } {
  const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  const nextX = currentGrid.x + dir.x;
  const nextY = currentGrid.y + dir.y;

  const inBounds = nextX >= 0 && nextX < navGrid.width && nextY >= 0 && nextY < navGrid.height;
  if (!inBounds) return currentGrid;
  if (blocked.has(navGrid.cellFromXY(nextX, nextY))) return currentGrid;
  return { x: nextX, y: nextY };
}

function processGuardAI(ctx: AIContext): { x: number; y: number } {
  const { enemy, currentGrid, startCell, blocked } = ctx;
  const enemyData = enemy.components.enemy;

  if (!enemyData.guardPosition) {
    enemyData.guardPosition = { x: currentGrid.x, y: currentGrid.y };
  }
  const guardPos = enemyData.guardPosition;
  const distance = Math.abs(currentGrid.x - guardPos.x) + Math.abs(currentGrid.y - guardPos.y);

  if (distance > GUARD_RADIUS) {
    return nextStepTowards(startCell, navGrid.cellFromXY(guardPos.x, guardPos.y), blocked);
  }

  if (Math.random() >= GUARD_MOVE_CHANCE) return currentGrid;

  const step = processRandomAI(ctx);
  const stepDistance = Math.abs(step.x - guardPos.x) + Math.abs(step.y - guardPos.y);
  return stepDistance <= GUARD_RADIUS ? step : currentGrid;
}

function generatePatrolWaypoints(startPos: { x: number; y: number }): Array<{ x: number; y: number }> {
  const size = 3;
  const maxX = GAME_CONFIG.GRID.WIDTH - 1;
  const maxY = GAME_CONFIG.GRID.HEIGHT - 1;
  return [
    { x: startPos.x, y: startPos.y },
    { x: Math.min(maxX, startPos.x + size), y: startPos.y },
    { x: Math.min(maxX, startPos.x + size), y: Math.min(maxY, startPos.y + size) },
    { x: startPos.x, y: Math.min(maxY, startPos.y + size) },
  ];
}

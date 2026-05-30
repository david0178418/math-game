import { gameEngine, type GameEngine } from '../Engine';
import { createEnemy } from '../entities';
import { createTimer } from 'ecspresso/plugins/scripting/timers';
import { GAME_CONFIG } from '../../config';
import { gridToPixel, pixelToGrid } from '../gameUtils';
import {
  enemyQuery,
  mathProblemQuery,
  playerQuery,
  spiderWebQuery,
  type PlayerEntity
} from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import type { EnemyType } from '../../types/shared';

const SPAWN_ORDER: readonly EnemyType[] = ['lizard', 'spider', 'frog'] as const;
type GridPosition = { x: number; y: number };
type PositionedEntity = { components: { position: { x: number; y: number } } };
const EDGE_POSITIONS: readonly GridPosition[] = [
  ...Array.from({ length: GAME_CONFIG.GRID.WIDTH }, (_, x) => ({ x, y: 0 })),
  ...Array.from({ length: GAME_CONFIG.GRID.WIDTH }, (_, x) => ({
    x,
    y: GAME_CONFIG.GRID.HEIGHT - 1,
  })),
  ...Array.from({ length: Math.max(0, GAME_CONFIG.GRID.HEIGHT - 2) }, (_, index) => index + 1)
    .flatMap(y => [
      { x: 0, y },
      { x: GAME_CONFIG.GRID.WIDTH - 1, y },
    ]),
];

export function addEnemySpawnSystemToEngine(): void {
  gameEngine.addSystem('enemySpawnSystem')
    .setPriority(SYSTEM_PRIORITIES.ENEMY_SPAWN)
    .addQuery('enemies', enemyQuery)
    .addQuery('mathProblems', mathProblemQuery)
    .addQuery('spiderWebs', spiderWebQuery)
    .addSingleton('player', { ...playerQuery, mutates: ['timers'] } as const)
    .setProcess(({ queries, ecs }) => {
      const player = queries.player;
      if (!player) return;

      const { index } = ecs.getResource('enemySpawn');
      const currentEnemyCount = queries.enemies.length;
      const cycleComplete = index >= SPAWN_ORDER.length;

      if (cycleComplete && currentEnemyCount === 0) {
        gameEngine.setResource('enemySpawn', { index: 0 });
        console.log('🔄 Resetting spawn cycle - ready to spawn new enemy sequence');
        return;
      }

      if (cycleComplete || currentEnemyCount >= GAME_CONFIG.ENEMY_SPAWN.MAX_ENEMIES) return;
      if (player.components.timers.enemySpawn?.active) return;

      const nextEnemyType = SPAWN_ORDER[index];
      if (!nextEnemyType) return;

      const occupiedCells = collectGridCells([
        player,
        ...queries.enemies,
        ...queries.spiderWebs,
      ]);
      const mathProblemCells = collectGridCells(
        queries.mathProblems.filter(problem => !problem.components.mathProblem.consumed)
      );
      const spawned = spawnEnemyFromEdge(ecs, nextEnemyType, occupiedCells, mathProblemCells);
      if (!spawned) {
        player.components.timers.enemySpawn = createTimer(GAME_CONFIG.TIMING.SHORT_DELAY / 1000);
        return;
      }

      console.log(`Spawned ${nextEnemyType} (#${index + 1}/${SPAWN_ORDER.length})`);

      const nextIndex = index + 1;
      gameEngine.setResource('enemySpawn', { index: nextIndex });
      if (nextIndex >= SPAWN_ORDER.length) console.log('🔄 Spawn cycle complete - all 3 enemy types spawned');

      player.components.timers.enemySpawn = createTimer(calculateSpawnInterval(player) / 1000);
    });
}

const DIFFICULTY_SCALE_SCORE = 100;
const SPAWN_REDUCTION_PER_LEVEL = 500;

function calculateSpawnInterval(player: PlayerEntity | undefined): number {
  if (!player) return GAME_CONFIG.TIMING.BASE_SPAWN_INTERVAL;

  const score = player.components.player.score;
  const difficultyLevel = Math.floor(score / DIFFICULTY_SCALE_SCORE);
  const adjusted = GAME_CONFIG.TIMING.BASE_SPAWN_INTERVAL - difficultyLevel * SPAWN_REDUCTION_PER_LEVEL;
  return Math.max(adjusted, GAME_CONFIG.TIMING.MIN_SPAWN_INTERVAL);
}

function spawnEnemyFromEdge(
  ecs: GameEngine,
  enemyType: EnemyType,
  occupiedCells: ReadonlySet<string>,
  mathProblemCells: ReadonlySet<string>,
): boolean {
  const edgePosition = getRandomAvailableEdgePosition(occupiedCells, mathProblemCells);
  if (!edgePosition) return false;

  const pixelPos = gridToPixel(edgePosition.x, edgePosition.y);
  const behaviors = GAME_CONFIG.ENEMY_TYPES[enemyType].AI_BEHAVIORS;
  const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];

  createEnemy(ecs.commands, pixelPos.x, pixelPos.y, enemyType, behavior);
  return true;
}

function gridKey({ x, y }: GridPosition): string {
  return `${x},${y}`;
}

function collectGridCells(entities: readonly PositionedEntity[]): Set<string> {
  return new Set(entities.map(entity =>
    gridKey(pixelToGrid(entity.components.position.x, entity.components.position.y))
  ));
}

function randomEntry<T>(entries: readonly T[]): T | undefined {
  return entries[Math.floor(Math.random() * entries.length)];
}

function getRandomAvailableEdgePosition(
  occupiedCells: ReadonlySet<string>,
  mathProblemCells: ReadonlySet<string>,
): GridPosition | undefined {
  const hardAvailable = EDGE_POSITIONS
    .filter(position => !occupiedCells.has(gridKey(position)));
  const preferred = hardAvailable
    .filter(position => !mathProblemCells.has(gridKey(position)));

  return randomEntry(preferred.length > 0 ? preferred : hardAvailable);
}

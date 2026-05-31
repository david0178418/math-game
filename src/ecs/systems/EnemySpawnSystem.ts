import { gameEngine, type GameEngine } from '../Engine';
import { createEnemy } from '../entities';
import { createTimer } from 'ecspresso/plugins/scripting/timers';
import { GAME_CONFIG } from '../../config';
import { gridToPixel } from '../gameUtils';
import {
  activeLilyPadGridCells,
  collectGridCellKeys,
  gridCellKey,
  isEdgeGridCell,
  type GridCell,
} from '../lilyPads';
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

      const occupiedCells = collectGridCellKeys([
        player,
        ...queries.enemies,
        ...queries.spiderWebs,
      ]);
      const lilyPadCells = activeLilyPadGridCells(queries.mathProblems);
      const spawned = spawnEnemyOnLilyPad(ecs, nextEnemyType, occupiedCells, lilyPadCells);
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

function spawnEnemyOnLilyPad(
  ecs: GameEngine,
  enemyType: EnemyType,
  occupiedCells: ReadonlySet<string>,
  lilyPadCells: readonly GridCell[],
): boolean {
  const spawnCell = getRandomAvailableLilyPad(occupiedCells, lilyPadCells);
  if (!spawnCell) return false;

  const pixelPos = gridToPixel(spawnCell.x, spawnCell.y);
  const behaviors = GAME_CONFIG.ENEMY_TYPES[enemyType].AI_BEHAVIORS;
  const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];

  createEnemy(ecs.commands, pixelPos.x, pixelPos.y, enemyType, behavior);
  return true;
}

function randomEntry<T>(entries: readonly T[]): T | undefined {
  return entries[Math.floor(Math.random() * entries.length)];
}

function getRandomAvailableLilyPad(
  occupiedCells: ReadonlySet<string>,
  lilyPadCells: readonly GridCell[],
): GridCell | undefined {
  const available = lilyPadCells
    .filter(position => !occupiedCells.has(gridCellKey(position)));
  const edge = available.filter(isEdgeGridCell);

  return randomEntry(edge.length > 0 ? edge : available);
}

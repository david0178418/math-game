import { gameEngine, type GameEngine } from '../Engine';
import { createEnemy } from '../entities';
import { createTimer } from 'ecspresso/plugins/scripting/timers';
import { GAME_CONFIG } from '../../config';
import { gridToPixel } from '../gameUtils';
import {
  enemyQuery,
  playerQuery,
  type PlayerEntity
} from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import type { AIBehavior, EnemyType } from '../../types/shared';

const SPAWN_ORDER: readonly EnemyType[] = ['lizard', 'spider', 'frog'] as const;
const BEHAVIORS: readonly AIBehavior[] = ['chase', 'random', 'patrol', 'guard'] as const;

export function addEnemySpawnSystemToEngine(): void {
  gameEngine.addSystem('enemySpawnSystem')
    .setPriority(SYSTEM_PRIORITIES.ENEMY_SPAWN)
    .addQuery('enemies', enemyQuery)
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

      spawnEnemyFromEdge(ecs, nextEnemyType);
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

function spawnEnemyFromEdge(ecs: GameEngine, enemyType: EnemyType): void {
  const edgePosition = getRandomEdgePosition();
  const pixelPos = gridToPixel(edgePosition.x, edgePosition.y);
  const behavior = BEHAVIORS[Math.floor(Math.random() * BEHAVIORS.length)];

  createEnemy(ecs.commands, pixelPos.x, pixelPos.y, enemyType, behavior);
}

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

  return edges[Math.floor(Math.random() * edges.length)];
}

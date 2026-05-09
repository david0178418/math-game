import { gameEngine, type GameEngine } from '../Engine';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { GAME_CONFIG } from '../../game/config';
import {
  spiderWebQuery,
  frozenPlayerQuery,
  type SpiderWebEntity,
  type FrozenPlayerEntity
} from '../queries';

const SPIDER_CONFIG = GAME_CONFIG.ENEMY_TYPES.SPIDER;

export function addSpiderWebSystemToEngine(): void {
  gameEngine.addSystem('spiderWebSystem')
    .setPriority(SYSTEM_PRIORITIES.SPIDER_WEB)
    .addQuery('spiderWebs', spiderWebQuery)
    .addQuery('frozenPlayers', frozenPlayerQuery)
    .setProcess(({ queries, ecs }) => {
      const currentTime = performance.now();

      processSpiderWebLifecycle(ecs, queries.spiderWebs, currentTime);
      processFreezeEffects(ecs, queries.frozenPlayers, currentTime);
    });
}

function processSpiderWebLifecycle(ecs: GameEngine, spiderWebs: SpiderWebEntity[], currentTime: number): void {
  for (const webEntity of spiderWebs) {
    const web = webEntity.components.spiderWeb;

    if (web.duration <= 0) {
      console.warn(`🕸️ WARNING: Invalid duration ${web.duration} for web ${webEntity.id}, using default`);
      web.duration = SPIDER_CONFIG.WEB_DURATION;
    }

    const timeSinceCreated = currentTime - web.createdTime;

    if (timeSinceCreated >= web.duration && web.isActive) {
      console.log(`🕸️ Spider web expired after ${web.duration}ms without catching a player`);
      ecs.commands.removeEntity(webEntity.id);
    }
  }
}

function processFreezeEffects(ecs: GameEngine, frozenPlayers: FrozenPlayerEntity[], currentTime: number): void {
  for (const playerEntity of frozenPlayers) {
    const freezeEffect = playerEntity.components.freezeEffect;

    if (freezeEffect.duration <= 0) {
      console.warn(`🧊 WARNING: Invalid duration ${freezeEffect.duration} for freeze effect ${playerEntity.id}, using default`);
      freezeEffect.duration = SPIDER_CONFIG.FREEZE_DURATION;
    }

    const timeFrozen = currentTime - freezeEffect.startTime;

    if (timeFrozen >= freezeEffect.duration && freezeEffect.isActive) {
      console.log(`🧊 Player freeze effect expired after ${freezeEffect.duration}ms`);

      if (freezeEffect.sourceWebId) {
        console.log(`🕸️ Cleaning up spider web #${freezeEffect.sourceWebId} that caught the player`);
        ecs.commands.removeEntity(freezeEffect.sourceWebId);
      }

      ecs.commands.removeComponent(playerEntity.id, 'freezeEffect');
    }
  }
}

export function createSpiderWeb(gridX: number, gridY: number): void {
  // Validate meaningful bounds
  if (gridX < 0 || gridX >= GAME_CONFIG.GRID.WIDTH || gridY < 0 || gridY >= GAME_CONFIG.GRID.HEIGHT) {
    console.error(`🕸️ ERROR: Grid coordinates (${gridX}, ${gridY}) outside bounds (0,0) to (${GAME_CONFIG.GRID.WIDTH-1},${GAME_CONFIG.GRID.HEIGHT-1})`);
    return;
  }
  
  const currentTime = performance.now();
  const pixelX = gridX * GAME_CONFIG.GRID.CELL_SIZE;
  const pixelY = gridY * GAME_CONFIG.GRID.CELL_SIZE;
  
  try {
    const webEntity = gameEngine.spawn({
      position: { x: pixelX, y: pixelY },
      spiderWeb: {
        duration: SPIDER_CONFIG.WEB_DURATION,
        freezeTime: SPIDER_CONFIG.FREEZE_DURATION,
        createdTime: currentTime,
        isActive: true
      },
      renderable: {
        shape: 'rectangle',
        color: 'rgba(128, 0, 128, 0.3)',
        size: GAME_CONFIG.GRID.CELL_SIZE * 0.8,
        layer: 1
      },
      collider: {
        width: GAME_CONFIG.GRID.CELL_SIZE,
        height: GAME_CONFIG.GRID.CELL_SIZE,
        group: 'spiderWeb'
      }
    });
    
    console.log(`🕸️ Created spider web at grid (${gridX}, ${gridY}) with entity ID ${webEntity.id}`);
  } catch (error) {
    console.error(`🕸️ ERROR: Failed to create spider web at grid (${gridX}, ${gridY}):`, error);
  }
} 
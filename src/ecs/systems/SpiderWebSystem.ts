import { gameEngine } from '../Engine';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { GAME_CONFIG } from '../../game/config';
import { 
  spiderWebQuery,
  frozenPlayerQuery,
  type SpiderWebEntity,
  type FrozenPlayerEntity
} from '../queries';

/**
 * Spider Web System
 * Manages spider web lifecycle including countdown timers and cleanup
 */

// Use centralized spider configuration
const SPIDER_CONFIG = GAME_CONFIG.ENEMY_TYPES.SPIDER;

// Add the spider web system to ECSpresso
export function addSpiderWebSystemToEngine(): void {
  gameEngine.addSystem('spiderWebSystem')
    .setPriority(SYSTEM_PRIORITIES.SPIDER_WEB)
    .addQuery('spiderWebs', spiderWebQuery)
    .addQuery('frozenPlayers', frozenPlayerQuery)
    .setProcess((queries) => {
      const currentTime = performance.now();
      
      // Process spider web lifecycle
      processSpiderWebLifecycle(queries.spiderWebs, currentTime);
      
      // Process player freeze effects
      processFreezeEffects(queries.frozenPlayers, currentTime);
    })
    .build();
}

/**
 * Process spider web lifecycle (expiration and cleanup)
 */
function processSpiderWebLifecycle(spiderWebs: SpiderWebEntity[], currentTime: number): void {
  for (const webEntity of spiderWebs) {
    const web = webEntity.components.spiderWeb;
    
    // Validate timing data (meaningful validation)
    if (web.duration <= 0) {
      console.warn(`🕸️ WARNING: Invalid duration ${web.duration} for web ${webEntity.id}, using default`);
      web.duration = SPIDER_CONFIG.WEB_DURATION;
    }
    
    const timeSinceCreated = currentTime - web.createdTime;
    
    // Check if web has expired
    if (timeSinceCreated >= web.duration && web.isActive) {
      console.log(`🕸️ Spider web expired after ${web.duration}ms without catching a player`);
      
      try {
        gameEngine.entityManager.removeEntity(webEntity.id);
      } catch (error) {
        console.error(`🕸️ ERROR: Failed to remove expired web entity ${webEntity.id}:`, error);
      }
    }
  }
}

/**
 * Process player freeze effects and cleanup
 */
function processFreezeEffects(frozenPlayers: FrozenPlayerEntity[], currentTime: number): void {
  for (const playerEntity of frozenPlayers) {
    const freezeEffect = playerEntity.components.freezeEffect;
    
    // Validate timing data (meaningful validation)
    if (freezeEffect.duration <= 0) {
      console.warn(`🧊 WARNING: Invalid duration ${freezeEffect.duration} for freeze effect ${playerEntity.id}, using default`);
      freezeEffect.duration = SPIDER_CONFIG.FREEZE_DURATION;
    }
    
    const timeFrozen = currentTime - freezeEffect.startTime;
    
    // Check if freeze effect has expired
    if (timeFrozen >= freezeEffect.duration && freezeEffect.isActive) {
      console.log(`🧊 Player freeze effect expired after ${freezeEffect.duration}ms`);
      
      // Clean up the specific spider web that caught this player
      if (freezeEffect.sourceWebId) {
        cleanupSpecificWeb(freezeEffect.sourceWebId);
      }
      
      try {
        gameEngine.entityManager.removeComponent(playerEntity.id, 'freezeEffect');
      } catch (error) {
        console.error(`🧊 ERROR: Failed to remove freeze effect from player ${playerEntity.id}:`, error);
      }
    }
  }
}

/**
 * Clean up the specific spider web that caught a player
 */
function cleanupSpecificWeb(webId: number): void {
  try {
    // Check if the web still exists before trying to remove it
    const webComponent = gameEngine.entityManager.getComponent(webId, 'spiderWeb');
    if (webComponent) {
      console.log(`🕸️ Cleaning up spider web #${webId} that caught the player`);
      gameEngine.entityManager.removeEntity(webId);
    } else {
      console.log(`🕸️ Spider web #${webId} already removed or doesn't exist`);
    }
  } catch (error) {
    console.error(`🕸️ ERROR: Failed to cleanup spider web ${webId}:`, error);
  }
}

/**
 * Create a spider web at the specified grid position
 */
export function createSpiderWeb(gridX: number, gridY: number): void {
  // Validate meaningful bounds
  const GRID_WIDTH = 6;
  const GRID_HEIGHT = 5;
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
    console.error(`🕸️ ERROR: Grid coordinates (${gridX}, ${gridY}) outside bounds (0,0) to (${GRID_WIDTH-1},${GRID_HEIGHT-1})`);
    return;
  }
  
  const currentTime = performance.now();
  const CELL_SIZE = 106;
  const pixelX = gridX * CELL_SIZE;
  const pixelY = gridY * CELL_SIZE;
  
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
        size: CELL_SIZE * 0.8,
        layer: 1
      },
      collider: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        group: 'spiderWeb'
      }
    });
    
    console.log(`🕸️ Created spider web at grid (${gridX}, ${gridY}) with entity ID ${webEntity.id}`);
  } catch (error) {
    console.error(`🕸️ ERROR: Failed to create spider web at grid (${gridX}, ${gridY}):`, error);
  }
} 
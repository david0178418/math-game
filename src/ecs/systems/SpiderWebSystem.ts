import { gameEngine } from '../Engine';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { createQueryDefinition } from 'ecspresso';
import type { Components } from '../Engine';

/**
 * Spider Web System
 * Manages spider web lifecycle including countdown timers and cleanup
 */

// Query for spider web entities
const spiderWebQuery = createQueryDefinition({
  with: ['position', 'spiderWeb']
});

// Query for players with freeze effects
const frozenPlayerQuery = createQueryDefinition({
  with: ['position', 'player', 'freezeEffect']
});

type SpiderWebEntity = {
  id: number;
  components: {
    position: Components['position'];
    spiderWeb: Components['spiderWeb'];
  };
};

type FrozenPlayerEntity = {
  id: number;
  components: {
    position: Components['position'];
    player: Components['player'];
    freezeEffect: Components['freezeEffect'];
  };
};

// Add the spider web system to ECSpresso
export function addSpiderWebSystemToEngine(): void {
  gameEngine.addSystem('spiderWebSystem')
    .setPriority(SYSTEM_PRIORITIES.AI - 1) // Run before AI system
    .addQuery('spiderWebs', spiderWebQuery)
    .addQuery('frozenPlayers', frozenPlayerQuery)
    .setProcess((queries) => {
      const currentTime = performance.now();
      const spiderWebs = queries.spiderWebs as SpiderWebEntity[];
      const frozenPlayers = queries.frozenPlayers as FrozenPlayerEntity[];
      
      // Process spider web lifecycle
      processSpiderWebLifecycle(spiderWebs, currentTime);
      
      // Process player freeze effects
      processFreezeEffects(frozenPlayers, currentTime);
    })
    .build();
}

/**
 * Process spider web lifecycle (expiration and cleanup)
 */
function processSpiderWebLifecycle(spiderWebs: SpiderWebEntity[], currentTime: number): void {
  for (const webEntity of spiderWebs) {
    const web = webEntity.components.spiderWeb;
    const timeSinceCreated = currentTime - web.createdTime;
    
    // Check if web has expired (8 seconds without catching a player)
    if (timeSinceCreated >= web.duration && web.isActive) {
      console.log(`🕸️ Spider web expired after ${web.duration}ms without catching a player`);
      
      // Remove the spider web entity
      gameEngine.entityManager.removeEntity(webEntity.id);
    }
  }
}

/**
 * Process player freeze effects and cleanup
 */
function processFreezeEffects(frozenPlayers: FrozenPlayerEntity[], currentTime: number): void {
  for (const playerEntity of frozenPlayers) {
    const freezeEffect = playerEntity.components.freezeEffect;
    const timeFrozen = currentTime - freezeEffect.startTime;
    
    // Check if freeze effect has expired
    if (timeFrozen >= freezeEffect.duration && freezeEffect.isActive) {
      console.log(`🧊 Player freeze effect expired after ${freezeEffect.duration}ms`);
      
      // Clean up the specific spider web that caught this player
      if (freezeEffect.sourceWebId) {
        cleanupSpecificWeb(freezeEffect.sourceWebId);
      }
      
      // Remove freeze effect component
      gameEngine.entityManager.removeComponent(playerEntity.id, 'freezeEffect');
    }
  }
}

/**
 * Clean up the specific spider web that caught a player
 */
function cleanupSpecificWeb(webId: number): void {
  // Check if the web still exists before trying to remove it
  const webComponent = gameEngine.entityManager.getComponent(webId, 'spiderWeb');
  if (webComponent) {
    console.log(`🕸️ Cleaning up spider web #${webId} that caught the player`);
    gameEngine.entityManager.removeEntity(webId);
  }
}

/**
 * Create a spider web at the specified grid position
 */
export function createSpiderWeb(gridX: number, gridY: number): void {
  const currentTime = performance.now();
  
  // Convert grid to pixel coordinates
  const CELL_SIZE = 106; // Import from config if needed
  const pixelX = gridX * CELL_SIZE;
  const pixelY = gridY * CELL_SIZE;
  
  // Create spider web entity
  gameEngine.spawn({
    position: { x: pixelX, y: pixelY },
    spiderWeb: {
      duration: 8000,        // 8 seconds until web disappears
      freezeTime: 2000,      // 2 seconds freeze duration when caught
      createdTime: currentTime,
      isActive: true
    },
    renderable: {
      shape: 'rectangle',
      color: 'rgba(128, 0, 128, 0.3)', // Semi-transparent purple
      size: CELL_SIZE * 0.8, // Slightly smaller than cell
      layer: 1 // Between background and entities
    },
    collider: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      group: 'spiderWeb'
    }
  });
  
  console.log(`🕸️ Created spider web at grid (${gridX}, ${gridY})`);
} 
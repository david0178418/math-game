import { gameEngine, type GameEngine } from '../Engine';
import { createTimer } from 'ecspresso/plugins/scripting/timers';
import { GAME_CONFIG } from '../../config';
import { gridToPixel } from '../gameUtils';

const SPIDER_CONFIG = GAME_CONFIG.ENEMY_TYPES.spider;

export function createSpiderWeb(ecs: GameEngine, gridX: number, gridY: number): void {
  if (gridX < 0 || gridX >= GAME_CONFIG.GRID.WIDTH || gridY < 0 || gridY >= GAME_CONFIG.GRID.HEIGHT) {
    console.error(`🕸️ ERROR: Grid coordinates (${gridX}, ${gridY}) outside bounds (0,0) to (${GAME_CONFIG.GRID.WIDTH-1},${GAME_CONFIG.GRID.HEIGHT-1})`);
    return;
  }

  const { x: pixelX, y: pixelY } = gridToPixel(gridX, gridY);

  ecs.commands.spawn({
    position: { x: pixelX, y: pixelY },
    spiderWeb: { freezeTime: SPIDER_CONFIG.FREEZE_DURATION },
    renderable: {
      shape: 'rectangle',
      color: 'rgba(128, 0, 128, 0.3)',
      size: GAME_CONFIG.GRID.CELL_SIZE * 0.8,
      layer: 1,
    },
    collider: {
      width: GAME_CONFIG.GRID.CELL_SIZE,
      height: GAME_CONFIG.GRID.CELL_SIZE,
      group: 'spiderWeb',
    },
    timers: {
      webExpiry: createTimer(SPIDER_CONFIG.WEB_DURATION / 1000, {
        onComplete: ({ entityId }) => {
          console.log(`🕸️ Spider web expired without catching a player`);
          gameEngine.commands.removeEntity(entityId);
        },
      }),
    },
  });

  console.log(`🕸️ Created spider web at grid (${gridX}, ${gridY})`);
}

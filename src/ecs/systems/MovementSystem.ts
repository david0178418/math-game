import { gameEngine, GAME_CONFIG } from '../Engine';

// Add the movement system to ECSpresso
export function addMovementSystemToEngine(): void {
  gameEngine.addSystem('movementSystem')
    .setPriority(90) // High priority, but after input system
    .addQuery('movingEntities', {
      with: ['position', 'velocity']
    })
    .addQuery('playerEntities', {
      with: ['position', 'velocity', 'player']
    })
    .setProcess((queries) => {
      // Process player movement based on input (grid-based)
      for (const entity of queries.playerEntities) {
        const position = entity.components.position;
        const player = entity.components.player;
        
        // Convert current pixel position to grid coordinates
        const currentGridX = Math.round(position.x / GAME_CONFIG.CELL_SIZE);
        const currentGridY = Math.round(position.y / GAME_CONFIG.CELL_SIZE);
        
        // Calculate new grid position based on input
        let newGridX = currentGridX;
        let newGridY = currentGridY;
        
        // Only allow one direction at a time (prevent diagonal movement)
        if (player.inputState.left && !player.inputState.right && !player.inputState.up && !player.inputState.down) {
          newGridX = Math.max(0, currentGridX - 1);
        } else if (player.inputState.right && !player.inputState.left && !player.inputState.up && !player.inputState.down) {
          newGridX = Math.min(GAME_CONFIG.GRID_WIDTH - 1, currentGridX + 1);
        } else if (player.inputState.up && !player.inputState.down && !player.inputState.left && !player.inputState.right) {
          newGridY = Math.max(0, currentGridY - 1);
        } else if (player.inputState.down && !player.inputState.up && !player.inputState.left && !player.inputState.right) {
          newGridY = Math.min(GAME_CONFIG.GRID_HEIGHT - 1, currentGridY + 1);
        }
        
        // Convert new grid position back to pixel coordinates
        const newPixelX = newGridX * GAME_CONFIG.CELL_SIZE;
        const newPixelY = newGridY * GAME_CONFIG.CELL_SIZE;
        
        // Update position if it changed
        if (newPixelX !== position.x || newPixelY !== position.y) {
          position.x = newPixelX;
          position.y = newPixelY;
        }
        
        // Clear input state after processing (prevents continuous movement)
        player.inputState.up = false;
        player.inputState.down = false;
        player.inputState.left = false;
        player.inputState.right = false;
      }
      
      // Note: We don't apply velocity-based movement for grid-based game
      // All other entities remain stationary unless they have special movement logic
    })
    .build();
}

// Helper function to convert grid coordinates to pixel coordinates
export function gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: gridX * GAME_CONFIG.CELL_SIZE,
    y: gridY * GAME_CONFIG.CELL_SIZE
  };
}

// Helper function to convert pixel coordinates to grid coordinates
export function pixelToGrid(pixelX: number, pixelY: number): { x: number; y: number } {
  return {
    x: Math.round(pixelX / GAME_CONFIG.CELL_SIZE),
    y: Math.round(pixelY / GAME_CONFIG.CELL_SIZE)
  };
}

// Helper function to snap position to grid
export function snapToGrid(position: { x: number; y: number }): { x: number; y: number } {
  const gridCoords = pixelToGrid(position.x, position.y);
  return gridToPixel(gridCoords.x, gridCoords.y);
}

// Helper function to check if two grid positions are the same
export function sameGridPosition(pos1: { x: number; y: number }, pos2: { x: number; y: number }): boolean {
  const grid1 = pixelToGrid(pos1.x, pos1.y);
  const grid2 = pixelToGrid(pos2.x, pos2.y);
  return grid1.x === grid2.x && grid1.y === grid2.y;
} 
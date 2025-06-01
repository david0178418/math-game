import { gameEngine } from '../Engine';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../../game/config';
import { startMovementAnimation, isEntityAnimating } from './AnimationSystem';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { startRotationAnimation } from './AnimationSystem';

// Add the movement system to ECSpresso
export function addMovementSystemToEngine(): void {
  gameEngine.addSystem('movementSystem')
    .setPriority(SYSTEM_PRIORITIES.MOVEMENT)
    .addQuery('playerEntities', {
      with: ['position', 'player']
    })
    .setProcess((queries) => {
      // Process player movement based on input (grid-based)
      for (const entity of queries.playerEntities) {
        const position = entity.components.position;
        const player = entity.components.player;
        
        // Skip if already animating (prevent input during transitions)
        if (isEntityAnimating(position)) {
          // Clear input state to prevent queuing
          player.inputState.up = false;
          player.inputState.down = false;
          player.inputState.left = false;
          player.inputState.right = false;
          continue;
        }
        
        // Convert current pixel position to grid coordinates
        const currentGridX = Math.round(position.x / CELL_SIZE);
        const currentGridY = Math.round(position.y / CELL_SIZE);
        
        // Calculate new grid position based on input
        let newGridX = currentGridX;
        let newGridY = currentGridY;
        
        // Only allow one direction at a time (prevent diagonal movement)
        if (player.inputState.left && !player.inputState.right && !player.inputState.up && !player.inputState.down) {
          newGridX = Math.max(0, currentGridX - 1);
        } else if (player.inputState.right && !player.inputState.left && !player.inputState.up && !player.inputState.down) {
          newGridX = Math.min(GRID_WIDTH - 1, currentGridX + 1);
        } else if (player.inputState.up && !player.inputState.down && !player.inputState.left && !player.inputState.right) {
          newGridY = Math.max(0, currentGridY - 1);
        } else if (player.inputState.down && !player.inputState.up && !player.inputState.left && !player.inputState.right) {
          newGridY = Math.min(GRID_HEIGHT - 1, currentGridY + 1);
        }
        
        // Convert new grid position back to pixel coordinates
        const newPixelX = newGridX * CELL_SIZE;
        const newPixelY = newGridY * CELL_SIZE;
        
        // Start animation if position changed
        if (newPixelX !== position.x || newPixelY !== position.y) {
          // Calculate rotation based on movement direction
          let targetRotation = position.rotation || 0; // Default to current rotation or 0 (up)
          
          if (player.inputState.up) {
            targetRotation = 0; // Up
          } else if (player.inputState.right) {
            targetRotation = 90; // Right
          } else if (player.inputState.down) {
            targetRotation = 180; // Down
          } else if (player.inputState.left) {
            targetRotation = 270; // Left
          }
          
          // Handle rotation wrapping (e.g., 350° to 10° should go through 360°, not backwards)
          const currentRotation = position.rotation || 0;
          if (Math.abs(targetRotation - currentRotation) > 180) {
            if (targetRotation > currentRotation) {
              targetRotation -= 360;
            } else {
              targetRotation += 360;
            }
          }
          
          // Start rotation animation (25% of movement duration)
          const rotationDuration = 750 * 0.25; // 25% of 750ms movement duration
          startMovementAnimation(position, newPixelX, newPixelY);
          startRotationAnimation(position, targetRotation, rotationDuration);
          
          // Publish player moved event (with target position)
          gameEngine.eventBus.publish('playerMoved', {
            x: newPixelX,
            y: newPixelY
          });
        }
        
        // Clear input state after processing (prevents continuous movement)
        player.inputState.up = false;
        player.inputState.down = false;
        player.inputState.left = false;
        player.inputState.right = false;
        // Note: eat input is cleared by the collision system after processing
      }
    })
    .build();
}

// Helper function to convert grid coordinates to pixel coordinates
export function gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: gridX * CELL_SIZE,
    y: gridY * CELL_SIZE
  };
}

// Helper function to convert pixel coordinates to grid coordinates
export function pixelToGrid(pixelX: number, pixelY: number): { x: number; y: number } {
  return {
    x: Math.round(pixelX / CELL_SIZE),
    y: Math.round(pixelY / CELL_SIZE)
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
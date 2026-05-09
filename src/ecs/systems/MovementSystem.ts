import { gameEngine } from '../Engine';
import { GAME_CONFIG } from '../../game/config';
import { startMovementAnimation, isEntityAnimating } from './AnimationSystem';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { startRotationAnimation } from './AnimationSystem';
import { playerQuery } from '../queries';
import { clearDirectionalInput } from '../gameUtils';

// Add the movement system to ECSpresso
export function addMovementSystemToEngine(): void {
  gameEngine.addSystem('movementSystem')
    .setPriority(SYSTEM_PRIORITIES.MOVEMENT)
    .setProcessEach(playerQuery, ({ entity, ecs }) => {
      const position = entity.components.position;
      const player = entity.components.player;

      const freezeEffect = ecs.getComponent(entity.id, 'freezeEffect');
      if (freezeEffect && freezeEffect.isActive) {
        clearDirectionalInput(player.inputState);
        console.log('❄️ Player movement blocked - frozen by spider web');
        return;
      }

      if (isEntityAnimating(position)) {
        clearDirectionalInput(player.inputState);
        return;
      }

      const currentGridX = Math.round(position.x / GAME_CONFIG.GRID.CELL_SIZE);
      const currentGridY = Math.round(position.y / GAME_CONFIG.GRID.CELL_SIZE);

      let newGridX = currentGridX;
      let newGridY = currentGridY;

      if (player.inputState.left && !player.inputState.right && !player.inputState.up && !player.inputState.down) {
        newGridX = Math.max(0, currentGridX - 1);
      } else if (player.inputState.right && !player.inputState.left && !player.inputState.up && !player.inputState.down) {
        newGridX = Math.min(GAME_CONFIG.GRID.WIDTH - 1, currentGridX + 1);
      } else if (player.inputState.up && !player.inputState.down && !player.inputState.left && !player.inputState.right) {
        newGridY = Math.max(0, currentGridY - 1);
      } else if (player.inputState.down && !player.inputState.up && !player.inputState.left && !player.inputState.right) {
        newGridY = Math.min(GAME_CONFIG.GRID.HEIGHT - 1, currentGridY + 1);
      }

      const newPixelX = newGridX * GAME_CONFIG.GRID.CELL_SIZE;
      const newPixelY = newGridY * GAME_CONFIG.GRID.CELL_SIZE;

      if (newPixelX !== position.x || newPixelY !== position.y) {
        let targetRotation = position.rotation || 0;

        if (player.inputState.up) {
          targetRotation = 0;
        } else if (player.inputState.right) {
          targetRotation = 90;
        } else if (player.inputState.down) {
          targetRotation = 180;
        } else if (player.inputState.left) {
          targetRotation = 270;
        }

        const currentRotation = position.rotation || 0;
        if (Math.abs(targetRotation - currentRotation) > 180) {
          if (targetRotation > currentRotation) {
            targetRotation -= 360;
          } else {
            targetRotation += 360;
          }
        }

        const rotationDuration = 750 * 0.25;
        startMovementAnimation(position, newPixelX, newPixelY);
        startRotationAnimation(position, targetRotation, rotationDuration);

        ecs.eventBus.publish('playerMoved', {
          x: newPixelX,
          y: newPixelY,
        });
      }

      clearDirectionalInput(player.inputState);
    });
}

// Helper function to convert grid coordinates to pixel coordinates
export function gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: gridX * GAME_CONFIG.GRID.CELL_SIZE,
    y: gridY * GAME_CONFIG.GRID.CELL_SIZE
  };
}

// Helper function to convert pixel coordinates to grid coordinates
export function pixelToGrid(pixelX: number, pixelY: number): { x: number; y: number } {
  return {
    x: Math.round(pixelX / GAME_CONFIG.GRID.CELL_SIZE),
    y: Math.round(pixelY / GAME_CONFIG.GRID.CELL_SIZE)
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
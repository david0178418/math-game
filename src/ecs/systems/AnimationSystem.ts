import { gameEngine } from '../Engine';
import { positionEntityQuery } from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { lerp } from '../gameUtils';

/**
 * Animation System
 * Handles smooth transitions between grid positions for all entities
 */

// Animation configuration
export const ANIMATION_CONFIG = {
  MOVEMENT_DURATION: 200, // milliseconds for grid movement
  EASING: 'ease-out', // easing type
} as const;

// Add the animation system to ECSpresso
export function addAnimationSystemToEngine(): void {
  gameEngine.addSystem('animationSystem')
    .setPriority(SYSTEM_PRIORITIES.ANIMATION) // Run after movement but before rendering
    .addQuery('animatedEntities', positionEntityQuery)
    .setProcess((queries) => {
      const currentTime = Date.now();
      
      for (const entity of queries.animatedEntities) {
        const position = entity.components.position;
        
        // Skip entities that aren't animating
        if (!position.isAnimating || position.targetX == null || position.targetY == null || !position.animationStartTime) {
          continue;
        }
        
        const elapsed = currentTime - position.animationStartTime;
        const duration = position.animationDuration || ANIMATION_CONFIG.MOVEMENT_DURATION;
        
        if (elapsed >= duration) {
          // Animation complete - snap to target position
          position.x = position.targetX;
          position.y = position.targetY;
          
          // Clear animation state
          position.isAnimating = false;
          position.targetX = undefined;
          position.targetY = undefined;
          position.animationStartTime = undefined;
          position.animationDuration = undefined;
          // Clear start position cache
          delete position.animationStartX;
          delete position.animationStartY;
          
          // Publish animation complete event
          gameEngine.eventBus.publish('animationComplete', {
            entityId: entity.id,
            x: position.x,
            y: position.y
          });
        } else {
          // Interpolate position
          const progress = elapsed / duration;
          const easedProgress = easeOutQuad(progress);
          
          // Store start position on first frame if not already stored
          if (!('animationStartX' in position)) {
            position.animationStartX = position.x;
            position.animationStartY = position.y;
          }
          
          // Use stored start positions for interpolation
          const startPosX = position.animationStartX;
          const startPosY = position.animationStartY;

          if (startPosX == null || startPosY == null) return;
          
          position.x = lerp(startPosX, position.targetX, easedProgress);
          position.y = lerp(startPosY, position.targetY, easedProgress);
        }
      }
    })
    .build();
}

/**
 * Start a movement animation for an entity
 */
export function startMovementAnimation(
  position: { 
    x: number; 
    y: number; 
    targetX?: number; 
    targetY?: number; 
    isAnimating?: boolean; 
    animationStartTime?: number; 
    animationDuration?: number;
    animationStartX?: number;
    animationStartY?: number;
  },
  targetX: number,
  targetY: number,
  duration: number = ANIMATION_CONFIG.MOVEMENT_DURATION
): void {
  // Store current position as start position
  position.animationStartX = position.x;
  position.animationStartY = position.y;
  
  // Set up animation
  position.targetX = targetX;
  position.targetY = targetY;
  position.isAnimating = true;
  position.animationStartTime = Date.now();
  position.animationDuration = duration;
}

/**
 * Check if an entity is currently animating
 */
export function isEntityAnimating(position: { isAnimating?: boolean }): boolean {
  return position.isAnimating === true;
}

/**
 * Easing function for smooth animation
 */
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Helper function to check if any entity with given component is animating
 */
export function hasAnimatingEntities(entities: Array<{ components: { position: { isAnimating?: boolean } } }>): boolean {
  return entities.some(entity => entity.components.position.isAnimating);
} 
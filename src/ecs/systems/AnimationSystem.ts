import { gameEngine } from '../Engine';
import { positionEntityQuery, playerQuery } from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { lerp } from '../gameUtils';

/**
 * Animation System
 * Handles smooth transitions between grid positions for all entities
 */

// Animation configuration
export const ANIMATION_CONFIG = {
  MOVEMENT_DURATION: 750, // milliseconds for grid movement
} as const;

// Add the animation system to ECSpresso
export function addAnimationSystemToEngine(): void {
  gameEngine.addSystem('animationSystem')
    .setPriority(SYSTEM_PRIORITIES.ANIMATION) // Run after movement but before rendering
    .addQuery('animatedEntities', positionEntityQuery)
    .addQuery('players', playerQuery)
    .setProcess((queries) => {
      const currentTime = Date.now();
      
      // Handle death animations for players
      for (const player of queries.players) {
        const playerComp = player.components.player;
        const position = player.components.position;
        
        if (playerComp.deathAnimationActive && playerComp.deathAnimationStartTime && playerComp.deathAnimationDuration) {
          const elapsed = currentTime - playerComp.deathAnimationStartTime;
          
          if (elapsed >= playerComp.deathAnimationDuration) {
            // Death animation complete
            playerComp.deathAnimationActive = false;
            playerComp.deathAnimationStartTime = undefined;
            playerComp.deathAnimationDuration = undefined;
            playerComp.deathScale = 0; // Fully shrunk
          } else {
            // Calculate death animation progress
            const progress = elapsed / playerComp.deathAnimationDuration;
            
            // Shrink effect: scale from 1.0 to 0.0
            playerComp.deathScale = 1.0 - progress;
            
            // Spinning effect: rotate continuously (3 full rotations during the animation)
            const spinSpeed = 3 * 360; // 3 full rotations in degrees
            position.rotation = (progress * spinSpeed) % 360;
          }
        }
      }
      
      // Handle regular position and rotation animations
      for (const entity of queries.animatedEntities) {
        const position = entity.components.position;
        
        // Handle position animation
        if (position.isAnimating && position.targetX != null && position.targetY != null && position.animationStartTime) {
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
        
        // Handle rotation animation
        if (position.targetRotation != null && position.rotationStartTime && position.startRotation != null) {
          const elapsed = currentTime - position.rotationStartTime;
          const duration = position.rotationDuration || (ANIMATION_CONFIG.MOVEMENT_DURATION * 0.25);
          
          if (elapsed >= duration) {
            // Rotation complete - snap to target rotation
            position.rotation = position.targetRotation;
            
            // Clear rotation animation state
            position.targetRotation = undefined;
            position.rotationStartTime = undefined;
            position.rotationDuration = undefined;
            position.startRotation = undefined;
          } else {
            // Interpolate rotation
            const progress = elapsed / duration;
            const easedProgress = easeOutQuad(progress);
            
            position.rotation = lerp(position.startRotation, position.targetRotation, easedProgress);
          }
        }
        
        // Handle shake animation
        if (position.shakeStartTime != null && position.shakeIntensity != null && position.shakeDuration != null) {
          const elapsed = currentTime - position.shakeStartTime;
          
          if (elapsed >= position.shakeDuration) {
            // Shake complete - clear shake state
            position.shakeIntensity = undefined;
            position.shakeDuration = undefined;
            position.shakeStartTime = undefined;
            position.shakeOffsetX = 0;
            position.shakeOffsetY = 0;
          } else {
            // Calculate shake offset with diminishing intensity
            const progress = elapsed / position.shakeDuration;
            const remainingIntensity = position.shakeIntensity * (1 - progress); // Diminish over time
            
            // Generate random shake offset
            position.shakeOffsetX = (Math.random() - 0.5) * remainingIntensity * 2;
            position.shakeOffsetY = (Math.random() - 0.5) * remainingIntensity * 2;
          }
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
 * Start a rotation animation for an entity
 */
export function startRotationAnimation(
  position: { 
    rotation?: number;
    targetRotation?: number;
    rotationStartTime?: number;
    rotationDuration?: number;
    startRotation?: number;
  },
  targetRotation: number,
  duration: number = ANIMATION_CONFIG.MOVEMENT_DURATION * 0.25
): void {
  // Initialize rotation if not set
  if (position.rotation === undefined) {
    position.rotation = 0;
  }
  
  // Store current rotation as start rotation
  position.startRotation = position.rotation;
  
  // Set up rotation animation
  position.targetRotation = targetRotation;
  position.rotationStartTime = Date.now();
  position.rotationDuration = duration;
}

/**
 * Start a shake animation for an entity
 */
export function startShakeAnimation(
  position: { 
    shakeIntensity?: number;
    shakeDuration?: number;
    shakeStartTime?: number;
    shakeOffsetX?: number;
    shakeOffsetY?: number;
  },
  intensity: number = 8,
  duration: number = 300
): void {
  // Set up shake animation
  position.shakeIntensity = intensity;
  position.shakeDuration = duration;
  position.shakeStartTime = Date.now();
  position.shakeOffsetX = 0;
  position.shakeOffsetY = 0;
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
import { gameEngine } from '../Engine';
import { positionEntityQuery, playerQuery } from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { ANIMATION_CONFIG } from '../../game/config';
import { lerp } from '../gameUtils';

/**
 * Animation System
 * Handles all entity animations: movement, rotation, shake, and death effects
 */

// Re-export animation config for external use
export { ANIMATION_CONFIG };

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
        processDeathAnimation(player, currentTime);
      }
      
      // Handle regular position and rotation animations
      for (const entity of queries.animatedEntities) {
        const position = entity.components.position;
        
        processMovementAnimation(position, currentTime);
        processRotationAnimation(position, currentTime);
        processShakeAnimation(position, currentTime);
      }
    })
    .build();
}

/**
 * Process death animation for a player entity
 */
function processDeathAnimation(
  player: { components: { player: any; position: any } },
  currentTime: number
): void {
  const playerComp = player.components.player;
  const position = player.components.position;
  
  if (!playerComp.deathAnimationActive || !playerComp.deathAnimationStartTime || !playerComp.deathAnimationDuration) {
    return;
  }
  
  const elapsed = currentTime - playerComp.deathAnimationStartTime;
  
  if (elapsed >= playerComp.deathAnimationDuration) {
    // Death animation complete
    playerComp.deathAnimationActive = false;
    playerComp.deathAnimationStartTime = undefined;
    playerComp.deathAnimationDuration = undefined;
    playerComp.deathScale = ANIMATION_CONFIG.DEATH.SCALE_END;
  } else {
    // Calculate death animation progress
    const progress = elapsed / playerComp.deathAnimationDuration;
    
    // Shrink effect: scale from start to end
    playerComp.deathScale = lerp(
      ANIMATION_CONFIG.DEATH.SCALE_START,
      ANIMATION_CONFIG.DEATH.SCALE_END,
      progress
    );
    
    // Spinning effect: continuous rotation
    const totalRotation = ANIMATION_CONFIG.DEATH.SPIN_ROTATIONS * 360;
    position.rotation = (progress * totalRotation) % 360;
  }
}

/**
 * Process movement animation for an entity
 */
function processMovementAnimation(position: any, currentTime: number): void {
  if (!position.isAnimating || position.targetX == null || position.targetY == null || !position.animationStartTime) {
    return;
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
    delete position.animationStartX;
    delete position.animationStartY;
    
    // Publish animation complete event
    gameEngine.eventBus.publish('animationComplete', {
      entityId: 0, // We don't have entity ID here, but keeping for compatibility
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
    
    const startPosX = position.animationStartX;
    const startPosY = position.animationStartY;

    if (startPosX == null || startPosY == null) return;
    
    position.x = lerp(startPosX, position.targetX, easedProgress);
    position.y = lerp(startPosY, position.targetY, easedProgress);
  }
}

/**
 * Process rotation animation for an entity
 */
function processRotationAnimation(position: any, currentTime: number): void {
  if (position.targetRotation == null || !position.rotationStartTime || position.startRotation == null) {
    return;
  }
  
  const elapsed = currentTime - position.rotationStartTime;
  const duration = position.rotationDuration || (ANIMATION_CONFIG.MOVEMENT_DURATION * ANIMATION_CONFIG.ROTATION_DURATION_RATIO);
  
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

/**
 * Process shake animation for an entity
 */
function processShakeAnimation(position: any, currentTime: number): void {
  if (position.shakeStartTime == null || position.shakeIntensity == null || position.shakeDuration == null) {
    return;
  }
  
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
    const remainingIntensity = position.shakeIntensity * (1 - progress);
    
    // Generate random shake offset
    position.shakeOffsetX = (Math.random() - 0.5) * remainingIntensity * 2;
    position.shakeOffsetY = (Math.random() - 0.5) * remainingIntensity * 2;
  }
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
  position.animationStartX = position.x;
  position.animationStartY = position.y;
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
  duration: number = ANIMATION_CONFIG.MOVEMENT_DURATION * ANIMATION_CONFIG.ROTATION_DURATION_RATIO
): void {
  if (position.rotation === undefined) {
    position.rotation = 0;
  }
  
  position.startRotation = position.rotation;
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
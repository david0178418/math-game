import { gameEngine } from '../Engine';
import { sameGridPosition } from '../gameUtils';
import { 
  playerWithHealthQuery, 
  mathProblemWithRenderableQuery, 
  enemyWithColliderQuery,
  spiderWebWithRenderableQuery,
  frogTongueQuery,
  type PlayerEntityWithHealth,
  type MathProblemEntityWithRenderable,
  type EnemyEntityWithCollider,
  type SpiderWebEntityWithRenderable,
  type FrogTongueEntity
} from '../queries';
import { COLLISION_CONFIG, SYSTEM_PRIORITIES } from '../systemConfigs';
import { ANIMATION_CONFIG, CELL_SIZE } from '../../game/config';
import { startShakeAnimation } from './AnimationSystem';

/**
 * Collision Detection System
 * Handles collisions between entities, particularly player-problem and player-web interactions
 */

// Add the collision system to ECSpresso
export function addCollisionSystemToEngine(): void {
  gameEngine.addSystem('collisionSystem')
    .setPriority(SYSTEM_PRIORITIES.COLLISION)
    .addQuery('players', playerWithHealthQuery)
    .addQuery('mathProblems', mathProblemWithRenderableQuery)
    .addQuery('enemies', enemyWithColliderQuery)
    .addQuery('spiderWebs', spiderWebWithRenderableQuery)
    .addQuery('frogTongues', frogTongueQuery)
    .setProcess((queries) => {
      const currentTime = performance.now();
      
      // Update invulnerability timers and check collisions
      for (const player of queries.players) {
        const healthComp = player.components.health;
        
        // Update invulnerability timer
        if (healthComp.invulnerable && currentTime > healthComp.invulnerabilityTime) {
          healthComp.invulnerable = false;
          console.log('Player invulnerability ended');
        }
        
        // Check for frog tongue collisions (only if not invulnerable)
        if (!healthComp.invulnerable) {
          for (const frog of queries.frogTongues) {
            const tongue = frog.components.frogTongue;
            
            // Only check collision if tongue is extended
            if (tongue.isExtended && tongue.segments.length > 0) {
              if (checkPlayerTongueCollision(player, frog)) {
                handlePlayerTongueCollision(player, frog);
                break; // Only one tongue can hit the player at a time
              }
            }
          }
        }
        
        // Check for spider web collisions (only if not already frozen)
        const freezeEffect = gameEngine.entityManager.getComponent(player.id, 'freezeEffect');
        if (!freezeEffect || !freezeEffect.isActive) {
          for (const spiderWeb of queries.spiderWebs) {
            const webComp = spiderWeb.components.spiderWeb;
            
            // Skip inactive webs
            if (!webComp.isActive) {
              continue;
            }
            
            // Check if player is on the same grid position as a spider web
            if (sameGridPosition(player.components.position, spiderWeb.components.position)) {
              handlePlayerSpiderWebCollision(player, spiderWeb, currentTime);
              break; // Only one web can catch the player at a time
            }
          }
        }
        
        // Check for math problems that can be consumed
        for (const problem of queries.mathProblems) {
          const mathProblemComp = problem.components.mathProblem;
          
          // Skip already consumed problems
          if (mathProblemComp.consumed) {
            continue;
          }
          
          // Check if player is on the same grid position as a math problem
          if (sameGridPosition(player.components.position, problem.components.position)) {
            // Only consume if player presses the eat button
            if (player.components.player.inputState.eat) {
              handlePlayerProblemCollision(player, problem);
              // Clear eat input after processing to prevent multiple consumption
              player.components.player.inputState.eat = false;
            }
          }
        }
        
        // Check collisions with enemies (only if not invulnerable)
        if (!healthComp.invulnerable) {
          for (const enemy of queries.enemies) {
            if (sameGridPosition(player.components.position, enemy.components.position)) {
              handlePlayerEnemyCollision(player, enemy);
            }
          }
        }
      }
    })
    .build();
}

/**
 * Handle collision between player and math problem
 */
function handlePlayerProblemCollision(
  player: PlayerEntityWithHealth, 
  problem: MathProblemEntityWithRenderable
): void {
  const playerComp = player.components.player;
  const mathProblemComp = problem.components.mathProblem;
  const problemRenderable = problem.components.renderable;
  
  console.log(`Player collided with math problem: ${mathProblemComp.value} (${mathProblemComp.isCorrect ? 'correct' : 'incorrect'})`);
  
  // Mark problem as consumed
  mathProblemComp.consumed = true;
  
  // Publish problem solved event
  gameEngine.eventBus.publish('problemSolved', {
    value: mathProblemComp.value,
    correct: mathProblemComp.isCorrect
  });
  
  // Update score based on correctness
  if (mathProblemComp.isCorrect) {
    // Correct answer: increase score
    const pointsEarned = mathProblemComp.value * mathProblemComp.difficulty;
    playerComp.score += pointsEarned;
    
    console.log(`Correct! +${pointsEarned} points. Total score: ${playerComp.score}`);
    
    // Update global score resource
    const scoreResource = gameEngine.getResource('score');
    if (scoreResource) {
      scoreResource.value = playerComp.score;
    }
  } else {
    // Wrong answer: lose a life
    playerComp.lives -= 1;
    
    console.log(`Wrong! -1 life. Lives remaining: ${playerComp.lives}`);
    
    // Shake the player for wrong answer
    startShakeAnimation(
      player.components.position, 
      ANIMATION_CONFIG.SHAKE.WRONG_ANSWER.INTENSITY, 
      ANIMATION_CONFIG.SHAKE.WRONG_ANSWER.DURATION
    );
    
    // Check for game over
    if (playerComp.lives <= 0) {
      console.log('Game Over!');
      // Disable player controls immediately
      playerComp.gameOverPending = true;
      // Start death animation
      playerComp.deathAnimationActive = true;
      playerComp.deathAnimationStartTime = Date.now();
      playerComp.deathAnimationDuration = ANIMATION_CONFIG.DEATH.DURATION;
      // Add delay before showing game over screen
      setTimeout(() => {
        gameEngine.addResource('gameState', 'gameOver');
      }, ANIMATION_CONFIG.DEATH.DURATION);
    }
  }
  
  // Hide the consumed problem by making it invisible
  problemRenderable.color = 'transparent';
  problemRenderable.size = 0;
}

/**
 * Handle collision between player and enemy
 */
function handlePlayerEnemyCollision(
  player: PlayerEntityWithHealth, 
  enemy: EnemyEntityWithCollider
): void {
  const playerComp = player.components.player;
  const healthComp = player.components.health;
  
  // Check if player is invulnerable
  if (healthComp.invulnerable) {
    return;
  }
  
  console.log('Player hit by enemy!');
  
  // Publish enemy collision event
  gameEngine.eventBus.publish('enemyCollision', {
    playerId: player.id,
    enemyId: enemy.id
  });
  
  // Lose a life
  playerComp.lives -= 1;
  healthComp.current -= 1;
  
  console.log(`Lives remaining: ${playerComp.lives}`);
  
  // Shake the player for damage taken
  startShakeAnimation(
    player.components.position, 
    ANIMATION_CONFIG.SHAKE.DAMAGE.INTENSITY, 
    ANIMATION_CONFIG.SHAKE.DAMAGE.DURATION
  );
  
  // Set invulnerability period using centralized config
  healthComp.invulnerable = true;
  healthComp.invulnerabilityTime = performance.now() + COLLISION_CONFIG.INVULNERABILITY_DURATION;
  
  // Check for game over
  if (playerComp.lives <= 0) {
    console.log('Game Over!');
    // Disable player controls immediately
    playerComp.gameOverPending = true;
    // Start death animation
    playerComp.deathAnimationActive = true;
    playerComp.deathAnimationStartTime = Date.now();
    playerComp.deathAnimationDuration = ANIMATION_CONFIG.DEATH.DURATION;
    // Add delay before showing game over screen
    setTimeout(() => {
      gameEngine.addResource('gameState', 'gameOver');
    }, ANIMATION_CONFIG.DEATH.DURATION);
  }
}

/**
 * Handle collision between player and spider web
 */
function handlePlayerSpiderWebCollision(
  player: PlayerEntityWithHealth, 
  spiderWeb: SpiderWebEntityWithRenderable, 
  currentTime: number
): void {
  const webComp = spiderWeb.components.spiderWeb;
  
  // Validate meaningful game state
  if (!webComp.isActive) {
    console.warn(`🕸️ WARNING: Attempting to handle collision with inactive web ${spiderWeb.id}`);
    return;
  }
  
  if (webComp.freezeTime <= 0) {
    console.warn(`🕸️ WARNING: Invalid freeze time ${webComp.freezeTime} for web ${spiderWeb.id}, using default`);
    webComp.freezeTime = 2000;
  }
  
  console.log(`🕸️ Player caught in spider web! Freezing for ${webComp.freezeTime}ms`);
  
  try {
    gameEngine.entityManager.addComponent(player.id, 'freezeEffect', {
      startTime: currentTime,
      duration: webComp.freezeTime,
      isActive: true,
      sourceWebId: spiderWeb.id
    });
    
    webComp.isActive = false;
  } catch (error) {
    console.error(`🕸️ ERROR: Failed to apply freeze effect to player ${player.id}:`, error);
  }
}

/**
 * Handle collision between player and frog tongue
 */
function handlePlayerTongueCollision(
  player: PlayerEntityWithHealth, 
  frog: FrogTongueEntity
): void {
  const playerComp = player.components.player;
  const healthComp = player.components.health;
  const tongueComp = frog.components.frogTongue;
  
  // Validate meaningful game state
  if (!tongueComp.isExtended) {
    console.warn(`🐸 WARNING: Collision detected with retracted tongue from frog ${frog.id}`);
    return;
  }
  
  if (tongueComp.segments.length === 0) {
    console.warn(`🐸 WARNING: Collision detected with tongue that has no segments from frog ${frog.id}`);
    return;
  }
  
  if (healthComp.invulnerable) {
    console.log(`🐸 Player hit by frog tongue but is invulnerable`);
    return;
  }
  
  if (playerComp.lives <= 0) {
    console.warn(`🐸 WARNING: Attempted to damage player who already has 0 lives`);
    return;
  }
  
  console.log(`🐸 Player hit by frog tongue! Taking damage.`);
  
  try {
    playerComp.lives -= 1;
    console.log(`💔 Player loses 1 life. Lives remaining: ${playerComp.lives}`);
    
    healthComp.invulnerable = true;
    healthComp.invulnerabilityTime = performance.now() + COLLISION_CONFIG.INVULNERABILITY_DURATION;
    
    startShakeAnimation(
      player.components.position, 
      ANIMATION_CONFIG.SHAKE.DAMAGE.INTENSITY, 
      ANIMATION_CONFIG.SHAKE.DAMAGE.DURATION
    );
    
    gameEngine.eventBus.publish('tongueCollision', {
      playerId: player.id,
      tongueId: frog.id
    });
    
    if (playerComp.lives <= 0) {
      console.log('💀 Game Over due to frog tongue attack!');
      playerComp.gameOverPending = true;
      playerComp.deathAnimationActive = true;
      playerComp.deathAnimationStartTime = Date.now();
      playerComp.deathAnimationDuration = ANIMATION_CONFIG.DEATH.DURATION;
      
      setTimeout(() => {
        try {
          gameEngine.addResource('gameState', 'gameOver');
        } catch (error) {
          console.error(`🐸 ERROR: Failed to set game over state:`, error);
        }
      }, ANIMATION_CONFIG.DEATH.DURATION);
    }
  } catch (error) {
    console.error(`🐸 ERROR: Failed to handle tongue collision for player ${player.id}:`, error);
  }
}

/**
 * Check if player is colliding with frog tongue
 */
function checkPlayerTongueCollision(
  player: PlayerEntityWithHealth, 
  frog: FrogTongueEntity
): boolean {
  const playerPos = player.components.position;
  const tongue = frog.components.frogTongue;
  
  if (!tongue.isExtended || tongue.segments.length === 0) {
    return false;
  }
  
  try {
    const playerGridX = Math.round(playerPos.x / CELL_SIZE);
    const playerGridY = Math.round(playerPos.y / CELL_SIZE);
    
    for (const segment of tongue.segments) {
      if (playerGridX === segment.x && playerGridY === segment.y) {
        console.log(`🐸 Collision detected: Player at (${playerGridX}, ${playerGridY}) hit tongue segment`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`🐸 ERROR: Exception in tongue collision detection:`, error);
    return false;
  }
} 
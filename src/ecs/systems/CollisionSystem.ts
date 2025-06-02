import { gameEngine } from '../Engine';
import { sameGridPosition } from '../gameUtils';
import { 
  playerWithHealthQuery, 
  mathProblemWithRenderableQuery, 
  enemyWithColliderQuery,
  type PlayerEntityWithHealth,
  type MathProblemEntityWithRenderable,
  type EnemyEntityWithCollider
} from '../queries';
import { COLLISION_CONFIG, SYSTEM_PRIORITIES } from '../systemConfigs';
import { startShakeAnimation } from './AnimationSystem';

/**
 * Collision Detection System
 * Handles collisions between entities, particularly player-problem interactions
 */

// Add the collision system to ECSpresso
export function addCollisionSystemToEngine(): void {
  gameEngine.addSystem('collisionSystem')
    .setPriority(SYSTEM_PRIORITIES.COLLISION)
    .addQuery('players', playerWithHealthQuery)
    .addQuery('mathProblems', mathProblemWithRenderableQuery)
    .addQuery('enemies', enemyWithColliderQuery)
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
    startShakeAnimation(player.components.position, 12, 400); // Higher intensity, longer duration for wrong answer
    
    // Check for game over
    if (playerComp.lives <= 0) {
      console.log('Game Over!');
      // Disable player controls immediately
      playerComp.gameOverPending = true;
      // Add 1 second delay before showing game over screen
      setTimeout(() => {
        gameEngine.addResource('gameState', 'gameOver');
      }, 1000);
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
  startShakeAnimation(player.components.position, 10, 350); // Medium intensity shake for damage
  
  // Set invulnerability period using centralized config
  healthComp.invulnerable = true;
  healthComp.invulnerabilityTime = performance.now() + COLLISION_CONFIG.INVULNERABILITY_DURATION;
  
  // Check for game over
  if (playerComp.lives <= 0) {
    console.log('Game Over!');
    // Disable player controls immediately
    playerComp.gameOverPending = true;
    // Add 1 second delay before showing game over screen
    setTimeout(() => {
      gameEngine.addResource('gameState', 'gameOver');
    }, 1000);
  }
} 
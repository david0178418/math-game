import { gameEngine } from '../Engine';
import { sameGridPosition } from './MovementSystem';

/**
 * Collision Detection System
 * Handles collisions between entities, particularly player-problem interactions
 */



// Add the collision system to ECSpresso
export function addCollisionSystemToEngine(): void {
  gameEngine.addSystem('collisionSystem')
    .setPriority(70) // After movement, before rendering
    .addQuery('players', {
      with: ['position', 'player', 'collider', 'health']
    })
    .addQuery('mathProblems', {
      with: ['position', 'mathProblem', 'collider']
    })
    .addQuery('enemies', {
      with: ['position', 'enemy', 'collider']
    })
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
  player: any, 
  problem: any
): void {
  const playerComp = player.components.player;
  const mathProblemComp = problem.components.mathProblem;
  const problemRenderable = problem.components.renderable;
  
  console.log(`Player collided with math problem: ${mathProblemComp.value} (${mathProblemComp.isCorrect ? 'correct' : 'incorrect'})`);
  
  // Mark problem as consumed
  mathProblemComp.consumed = true;
  
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
    
    // Check for game over
    if (playerComp.lives <= 0) {
      console.log('Game Over!');
      gameEngine.addResource('gameState', 'gameOver');
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
  player: any, 
  _enemy: any
): void {
  const playerComp = player.components.player;
  const healthComp = player.components.health;
  
  // Check if player is invulnerable
  if (healthComp.invulnerable) {
    return;
  }
  
  console.log('Player hit by enemy!');
  
  // Lose a life
  playerComp.lives -= 1;
  healthComp.current -= 1;
  
  console.log(`Lives remaining: ${playerComp.lives}`);
  
  // Set invulnerability period (2 seconds)
  healthComp.invulnerable = true;
  healthComp.invulnerabilityTime = performance.now() + 2000;
  
  // Check for game over
  if (playerComp.lives <= 0) {
    console.log('Game Over!');
    gameEngine.addResource('gameState', 'gameOver');
  }
} 
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
      with: ['position', 'player', 'collider']
    })
    .addQuery('mathProblems', {
      with: ['position', 'mathProblem', 'collider']
    })
    .setProcess((queries) => {
      // Check collisions between players and math problems
      for (const player of queries.players) {
        for (const problem of queries.mathProblems) {
          const mathProblemComp = problem.components.mathProblem;
          
          // Skip already consumed problems
          if (mathProblemComp.consumed) {
            continue;
          }
          
          // Check if player and problem are at the same grid position
          if (sameGridPosition(player.components.position, problem.components.position)) {
            handlePlayerProblemCollision(player, problem);
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
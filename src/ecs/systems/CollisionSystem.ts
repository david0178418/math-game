import { gameEngine, createTimer } from '../Engine';
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
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { ANIMATION_CONFIG, GAME_CONFIG } from '../../game/config';
import { startShake, startDeathAnimation } from './AnimationSystem';

const triggerGameOver = (player: PlayerEntityWithHealth, reason: string): void => {
  console.log(reason);
  player.components.player.gameOverPending = true;
  startDeathAnimation(gameEngine, player.id, player.components.position.rotation ?? 0);
  player.components.timers.deathDelay = createTimer(ANIMATION_CONFIG.DEATH.DURATION / 1000, {
    onComplete: () => { void gameEngine.setScreen('gameOver', {}); },
  });
};

const isInvulnerable = (player: PlayerEntityWithHealth): boolean =>
  player.components.timers.invulnerability?.active === true;

const startInvulnerability = (player: PlayerEntityWithHealth): void => {
  player.components.timers.invulnerability = createTimer(GAME_CONFIG.TIMING.INVULNERABILITY / 1000);
};

/**
 * Collision Detection System
 * Handles collisions between entities, particularly player-problem and player-web interactions
 */

// Add the collision system to ECSpresso
export function addCollisionSystemToEngine(): void {
  gameEngine.addSystem('collisionSystem')
    .setPriority(SYSTEM_PRIORITIES.COLLISION)
    .addSingleton('player', playerWithHealthQuery)
    .addQuery('mathProblems', mathProblemWithRenderableQuery)
    .addQuery('enemies', enemyWithColliderQuery)
    .addQuery('spiderWebs', spiderWebWithRenderableQuery)
    .addQuery('frogTongues', frogTongueQuery)
    .withResources(['inputState'])
    .setProcess(({ queries, resources: { inputState } }) => {
      const player = queries.player;
      if (!player) return;

      const invulnerable = isInvulnerable(player);
      const frozen = player.components.timers.freeze?.active === true;

      if (!invulnerable) {
        for (const frog of queries.frogTongues) {
          const tongue = frog.components.frogTongue;
          if (tongue.isExtended && tongue.segments.length > 0 && checkPlayerTongueCollision(player, frog)) {
            handlePlayerTongueCollision(player, frog);
            break;
          }
        }
      }

      if (!frozen) {
        for (const spiderWeb of queries.spiderWebs) {
          if (sameGridPosition(player.components.position, spiderWeb.components.position)) {
            handlePlayerSpiderWebCollision(player, spiderWeb);
            break;
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
          if (inputState.actions.justActivated('eat')) {
            handlePlayerProblemCollision(player, problem);
          }
        }
      }

      if (!invulnerable) {
        for (const enemy of queries.enemies) {
          if (sameGridPosition(player.components.position, enemy.components.position)) {
            handlePlayerEnemyCollision(player, enemy);
          }
        }
      }
    });
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
    startShake(
      gameEngine,
      player.id,
      ANIMATION_CONFIG.SHAKE.WRONG_ANSWER.INTENSITY,
      ANIMATION_CONFIG.SHAKE.WRONG_ANSWER.DURATION
    );
    
    if (playerComp.lives <= 0) {
      triggerGameOver(player, 'Game Over!');
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
  if (isInvulnerable(player)) return;

  const playerComp = player.components.player;
  const healthComp = player.components.health;

  console.log('Player hit by enemy!');

  gameEngine.eventBus.publish('enemyCollision', {
    playerId: player.id,
    enemyId: enemy.id
  });

  playerComp.lives -= 1;
  healthComp.current -= 1;

  console.log(`Lives remaining: ${playerComp.lives}`);

  startShake(
    gameEngine,
    player.id,
    ANIMATION_CONFIG.SHAKE.DAMAGE.INTENSITY,
    ANIMATION_CONFIG.SHAKE.DAMAGE.DURATION
  );

  startInvulnerability(player);

  if (playerComp.lives <= 0) {
    triggerGameOver(player, 'Game Over!');
  }
}

/**
 * Handle collision between player and spider web
 */
function handlePlayerSpiderWebCollision(
  player: PlayerEntityWithHealth,
  spiderWeb: SpiderWebEntityWithRenderable
): void {
  const freezeTime = spiderWeb.components.spiderWeb.freezeTime;
  console.log(`🕸️ Player caught in spider web! Freezing for ${freezeTime}ms`);

  player.components.timers.freeze = createTimer(freezeTime / 1000);
  gameEngine.commands.removeEntity(spiderWeb.id);
}

/**
 * Handle collision between player and frog tongue
 */
function handlePlayerTongueCollision(
  player: PlayerEntityWithHealth,
  frog: FrogTongueEntity
): void {
  const playerComp = player.components.player;
  const tongueComp = frog.components.frogTongue;

  if (!tongueComp.isExtended || tongueComp.segments.length === 0) return;
  if (isInvulnerable(player)) {
    console.log(`🐸 Player hit by frog tongue but is invulnerable`);
    return;
  }
  if (playerComp.lives <= 0) return;

  console.log(`🐸 Player hit by frog tongue! Taking damage.`);

  playerComp.lives -= 1;
  console.log(`💔 Player loses 1 life. Lives remaining: ${playerComp.lives}`);

  startInvulnerability(player);

  startShake(
    gameEngine,
    player.id,
    ANIMATION_CONFIG.SHAKE.DAMAGE.INTENSITY,
    ANIMATION_CONFIG.SHAKE.DAMAGE.DURATION
  );

  gameEngine.eventBus.publish('tongueCollision', {
    playerId: player.id,
    tongueId: frog.id
  });

  if (playerComp.lives <= 0) {
    triggerGameOver(player, '💀 Game Over due to frog tongue attack!');
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
    const playerGridX = Math.round(playerPos.x / GAME_CONFIG.GRID.CELL_SIZE);
    const playerGridY = Math.round(playerPos.y / GAME_CONFIG.GRID.CELL_SIZE);
    
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
import { gameEngine } from '../Engine';
import { createTimer } from 'ecspresso/plugins/scripting/timers';
import { activePlayerGridCell, positionInGridCell, sameGridPosition } from '../gameUtils';
import {
  playerWithHealthQuery,
  mathProblemWithRenderableQuery,
  enemyWithColliderQuery,
  spiderWebWithRenderableQuery,
  frogTongueQuery,
  type PlayerEntityWithHealth,
  type MathProblemEntityWithRenderable,
  type SpiderWebEntityWithRenderable,
  type FrogTongueEntity
} from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { ANIMATION_CONFIG, GAME_CONFIG } from '../../config';
import { startShake, startDeathAnimation } from './AnimationSystem';
import { chooseEquationCandidate, evaluateEquationSelection } from '../../math/equations';
import type { EquationModeState } from '../types';

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
    .addSingleton('player', { ...playerWithHealthQuery, mutates: ['player', 'health', 'timers'] } as const)
    .addQuery('mathProblems', { ...mathProblemWithRenderableQuery, mutates: ['mathProblem', 'renderable'] } as const)
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
          if (tongue.phase !== 'idle' && tongue.segments.length > 0 && checkPlayerTongueCollision(player, frog)) {
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

      const activeProblemCell = activePlayerGridCell(player);

      // Check for math problems that can be consumed
      for (const problem of queries.mathProblems) {
        const mathProblemComp = problem.components.mathProblem;

        // Skip already consumed problems
        if (mathProblemComp.consumed) {
          continue;
        }

        // Math problems follow the intended active tile, not the rendered midpoint.
        if (positionInGridCell(problem.components.position, activeProblemCell)) {
          if (inputState.actions.justActivated('eat')) {
            handlePlayerProblemCollision(player, problem, queries.mathProblems);
          }
        }
      }

      if (!invulnerable) {
        for (const enemy of queries.enemies) {
          if (sameGridPosition(player.components.position, enemy.components.position)) {
            handlePlayerEnemyCollision(player);
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
  problem: MathProblemEntityWithRenderable,
  mathProblems: MathProblemEntityWithRenderable[],
): void {
  if (gameEngine.getResource('gameMode') !== 'multiples') {
    handleEquationProblemSelection(player, problem, mathProblems);
    return;
  }
  handleMultiplesProblemCollision(player, problem);
}

function handleMultiplesProblemCollision(
  player: PlayerEntityWithHealth,
  problem: MathProblemEntityWithRenderable,
): void {
  const playerComp = player.components.player;
  const mathProblemComp = problem.components.mathProblem;
  const problemRenderable = problem.components.renderable;
  
  console.log(`Player collided with math problem: ${mathProblemComp.value} (${mathProblemComp.isCorrect ? 'correct' : 'incorrect'})`);
  
  // Mark problem as consumed
  mathProblemComp.consumed = true;

  // Update score based on correctness
  if (mathProblemComp.isCorrect === true) {
    // Correct answer: increase score
    const pointsEarned = mathProblemComp.value * mathProblemComp.difficulty;
    playerComp.score += pointsEarned;
    
    console.log(`Correct! +${pointsEarned} points. Total score: ${playerComp.score}`);
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

const hideProblem = (problem: MathProblemEntityWithRenderable): void => {
  problem.components.mathProblem.consumed = true;
  problem.components.renderable.color = 'transparent';
  problem.components.renderable.size = 0;
};

const selectedProblemValues = (
  selectedProblems: readonly MathProblemEntityWithRenderable[],
): number[] =>
  selectedProblems.map(selectedProblem => selectedProblem.components.mathProblem.value);

const findSelectedProblems = (
  selectedProblemIds: readonly number[],
  mathProblems: readonly MathProblemEntityWithRenderable[],
): MathProblemEntityWithRenderable[] =>
  selectedProblemIds.flatMap((id) => {
    const selectedProblem = mathProblems.find(candidate => candidate.id === id);
    return selectedProblem ? [selectedProblem] : [];
  });

const activeEquationOperands = (
  mathProblems: readonly MathProblemEntityWithRenderable[],
): Array<{ id: number; value: number }> =>
  mathProblems
    .filter(candidate => !candidate.components.mathProblem.consumed)
    .map(candidate => ({
      id: candidate.id,
      value: candidate.components.mathProblem.value,
    }));

function handleEquationProblemSelection(
  player: PlayerEntityWithHealth,
  problem: MathProblemEntityWithRenderable,
  mathProblems: MathProblemEntityWithRenderable[],
): void {
  const equationMode = gameEngine.getResource('equationMode');
  if (equationMode.target === 0) return;

  const selectedProblemIds = equationMode.selectedProblemIds.includes(problem.id)
    ? equationMode.selectedProblemIds.filter(id => id !== problem.id)
    : [...equationMode.selectedProblemIds, problem.id].slice(0, equationMode.operandsRequired);

  const pendingMode = {
    ...equationMode,
    selectedProblemIds,
  };

  if (selectedProblemIds.length < equationMode.operandsRequired) {
    gameEngine.setResource('equationMode', pendingMode);
    return;
  }

  const selectedProblems = findSelectedProblems(selectedProblemIds, mathProblems);
  const selectedValues = selectedProblemValues(selectedProblems);
  const isCorrect = evaluateEquationSelection(pendingMode, selectedValues);

  if (!isCorrect) {
    handleIncorrectEquationSelection(player, pendingMode);
    return;
  }

  selectedProblems.forEach(hideProblem);

  const pointsEarned = pendingMode.target * problem.components.mathProblem.difficulty;
  player.components.player.score += pointsEarned;

  const nextMode = {
    ...pendingMode,
    selectedProblemIds: [],
    clearedThisLevel: pendingMode.clearedThisLevel + selectedProblemIds.length,
    target: 0,
  };

  const nextCandidate = chooseEquationCandidate(
    nextMode,
    activeEquationOperands(mathProblems),
  );

  gameEngine.setResource('equationMode', nextCandidate
    ? { ...nextMode, target: nextCandidate.target, promptValues: nextCandidate.operandValues }
    : nextMode);
}

function handleIncorrectEquationSelection(
  player: PlayerEntityWithHealth,
  equationMode: EquationModeState,
): void {
  const playerComp = player.components.player;
  playerComp.lives -= 1;

  startShake(
    gameEngine,
    player.id,
    ANIMATION_CONFIG.SHAKE.WRONG_ANSWER.INTENSITY,
    ANIMATION_CONFIG.SHAKE.WRONG_ANSWER.DURATION
  );

  gameEngine.setResource('equationMode', {
    ...equationMode,
    selectedProblemIds: [],
  });

  if (playerComp.lives <= 0) {
    triggerGameOver(player, 'Game Over!');
  }
}

/**
 * Handle collision between player and enemy
 */
function handlePlayerEnemyCollision(player: PlayerEntityWithHealth): void {
  if (isInvulnerable(player)) return;

  const playerComp = player.components.player;
  const healthComp = player.components.health;

  console.log('Player hit by enemy!');

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

  if (tongueComp.phase === 'idle' || tongueComp.segments.length === 0) return;
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
  
  if (tongue.phase === 'idle' || tongue.segments.length === 0) {
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

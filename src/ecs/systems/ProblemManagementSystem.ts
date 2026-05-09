import { gameEngine, EntityFactory, type GameEngine } from '../Engine';
import { GAME_CONFIG, SCORE_THRESHOLDS } from '../../game/config';
import { gridToPixel } from './MovementSystem';
import { mathProblemGenerator } from '../../game/MathProblemGenerator';
import {
  mathProblemWithRenderableQuery,
  playerQuery,
  positionEntityQuery,
  type MathProblemEntityWithRenderable,
  type PositionEntity
} from '../queries';
import { PROBLEM_CONFIG, SYSTEM_PRIORITIES } from '../systemConfigs';

/**
 * Problem Management System
 * Manages the lifecycle of math problems: spawning, tracking, and replacing consumed ones
 */

let lastSpawnTime = 0;

// Add the problem management system to ECSpresso
export function addProblemManagementSystemToEngine(): void {
  gameEngine.addSystem('problemManagementSystem')
    .setPriority(SYSTEM_PRIORITIES.PROBLEM_MANAGEMENT)
    .inScreens(['playing'])
    .addQuery('mathProblems', mathProblemWithRenderableQuery)
    .addSingleton('player', playerQuery)
    .addQuery('allPositions', positionEntityQuery)
    .setProcess(({ queries, ecs }) => {
      const activeProblems = queries.mathProblems.filter(
        problem => !problem.components.mathProblem.consumed
      );

      const currentTime = performance.now();
      if (activeProblems.length === 0 &&
          currentTime - lastSpawnTime > GAME_CONFIG.TIMING.SHORT_DELAY) {
        const player = queries.player;
        if (player) {
          adjustDifficultyBasedOnScore(player.components.player.score);
        }

        populateFullGrid(ecs, queries.allPositions);

        lastSpawnTime = currentTime;
      }

      checkLevelCompletion(queries.mathProblems);
      cleanupConsumedProblems(ecs, queries.mathProblems);
    });
}

/**
 * Populate the entire grid with math problems
 */
function populateFullGrid(ecs: GameEngine, allPositionEntities: PositionEntity[]): void {
  const gameMode = gameEngine.getResource('gameMode');
  const currentLevel = gameEngine.getResource('currentLevel');
  
  if (gameMode !== 'multiples') return;
  
  // Get all problems needed for this level (30 problems for full grid)
  const allProblems = mathProblemGenerator.generateMultiplesProblems(currentLevel, PROBLEM_CONFIG.TOTAL_PROBLEMS);
  
  // Get ALL grid positions that don't already have math problems
  const availablePositions = getAllGridPositionsWithoutMathProblems(allPositionEntities);
  
  // Place problems in all available positions
  const problemsToPlace = Math.min(allProblems.length, availablePositions.length);
  
  for (let i = 0; i < problemsToPlace; i++) {
    const problem = allProblems[i];
    const gridPos = availablePositions[i];
    const pixelPos = gridToPixel(gridPos.x, gridPos.y);
    
    EntityFactory.createMathProblem(
      ecs.commands,
      pixelPos.x,
      pixelPos.y,
      problem.value,
      problem.isCorrect,
      1
    );
  }
  
  console.log(`Populated grid with ${problemsToPlace} problems for multiples of ${currentLevel} - ALL grid positions filled`);
}

/**
 * Get all grid positions that don't already have math problems
 * This allows players and enemies to coexist with math problems on the same tiles
 */
function getAllGridPositionsWithoutMathProblems(allPositionEntities: PositionEntity[]): { x: number; y: number }[] {
  const mathProblemPositions = new Set<string>();
  
  // Get all positions that already have math problems
  for (const entity of allPositionEntities) {
    const position = entity.components.position;
    const hasMathProblem = entity.components.mathProblem;
    
    if (position && hasMathProblem) {
      const gridX = Math.round(position.x / GAME_CONFIG.GRID.CELL_SIZE);
      const gridY = Math.round(position.y / GAME_CONFIG.GRID.CELL_SIZE);
      mathProblemPositions.add(`${gridX},${gridY}`);
    }
  }
  
  // Get all positions that don't have math problems yet
  const availablePositions: { x: number; y: number }[] = [];
  for (let y = 0; y < GAME_CONFIG.GRID.HEIGHT; y++) {
    for (let x = 0; x < GAME_CONFIG.GRID.WIDTH; x++) {
      const key = `${x},${y}`;
      if (!mathProblemPositions.has(key)) {
        availablePositions.push({ x, y });
      }
    }
  }
  
  return availablePositions;
}

/**
 * Adjust difficulty based on player score
 */
function adjustDifficultyBasedOnScore(score: number): void {
  if (score < SCORE_THRESHOLDS.MEDIUM_DIFFICULTY_SCORE) {
    mathProblemGenerator.setDifficulty('EASY');
  } else if (score < SCORE_THRESHOLDS.HARD_DIFFICULTY_SCORE) {
    mathProblemGenerator.setDifficulty('MEDIUM');
  } else {
    mathProblemGenerator.setDifficulty('HARD');
  }
}

/**
 * Check if all correct answers have been consumed (level completion).
 *
 * Triggers a `setScreen('playing', { level: nextLevel })` round-trip — the
 * exit clears all `{ scope: 'playing' }` entities (problems, enemies, webs)
 * and the re-entry rebuilds the board via `GameInitializer`'s screen hook.
 * The player entity is unscoped, so score and lives persist into the new level.
 */
function checkLevelCompletion(mathProblems: MathProblemEntityWithRenderable[]): void {
  const gameMode = gameEngine.getResource('gameMode');
  const currentLevel = gameEngine.getResource('currentLevel');

  if (gameMode !== 'multiples') return;

  const correctMultiples: number[] = [];
  for (let i = 1; i <= 12; i++) {
    correctMultiples.push(currentLevel * i);
  }

  const correctProblemsOnBoard = mathProblems.filter(problem => {
    const mathProblem = problem.components.mathProblem;
    return correctMultiples.includes(mathProblem.value) && mathProblem.isCorrect;
  });

  const allCorrectConsumed = correctProblemsOnBoard.every(problem =>
    problem.components.mathProblem.consumed
  );

  if (allCorrectConsumed && correctProblemsOnBoard.length > 0) {
    const nextLevel = currentLevel + 1;

    console.log(`🎉 Level ${currentLevel} completed! Advancing to multiples of ${nextLevel}`);

    // Force the next ProblemManagementSystem tick (after re-entry) to repopulate
    // immediately rather than waiting for SHORT_DELAY.
    lastSpawnTime = 0;

    void gameEngine.setScreen('playing', { level: nextLevel, isFreshGame: false });
  }
}

/**
 * Clean up consumed problems that are no longer visible
 */
function cleanupConsumedProblems(ecs: GameEngine, mathProblems: MathProblemEntityWithRenderable[]): void {
  if (mathProblems.length <= PROBLEM_CONFIG.TOTAL_PROBLEMS) return;

  mathProblems
    .filter(problem =>
      problem.components.mathProblem.consumed &&
      problem.components.renderable.size === 0
    )
    .forEach(problem => {
      ecs.commands.removeEntity(problem.id);
    });
} 
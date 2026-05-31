import { gameEngine, type GameEngine } from '../Engine';
import { createMathProblem } from '../entities';
import { createTimer } from 'ecspresso/plugins/scripting/timers';
import { GAME_CONFIG } from '../../config';
import { gridToPixel } from '../gameUtils';
import { generateMultiplesProblems } from '../../math/problems';
import {
  chooseEquationCandidate,
  createEquationModeState,
  randomEquationValue,
} from '../../math/equations';
import {
  mathProblemWithRenderableQuery,
  playerQuery,
  positionEntityQuery,
  type MathProblemEntityWithRenderable,
  type PlayerEntity,
  type PositionEntity
} from '../queries';
import { PROBLEM_CONFIG, SYSTEM_PRIORITIES } from '../systemConfigs';
import type { Resources } from '../types';

interface ProblemPlacement {
  value: number;
  isCorrect?: boolean;
}

/**
 * Problem Management System
 * Manages the lifecycle of math problems: spawning, tracking, and replacing consumed ones
 */

// Add the problem management system to ECSpresso
export function addProblemManagementSystemToEngine(): void {
  gameEngine.addSystem('problemManagementSystem')
    .setPriority(SYSTEM_PRIORITIES.PROBLEM_MANAGEMENT)
    .addQuery('mathProblems', mathProblemWithRenderableQuery)
    .addSingleton('player', { ...playerQuery, mutates: ['timers'] } as const)
    .addQuery('allPositions', positionEntityQuery)
    .setProcess(({ queries, ecs }) => {
      const player = queries.player;
      const activeProblems = queries.mathProblems.filter(
        problem => !problem.components.mathProblem.consumed
      );

      if (player) {
        const gameMode = ecs.getResource('gameMode');
        const currentLevel = ecs.getResource('currentLevel');
        const shouldPopulate = gameMode === 'multiples'
          ? activeProblems.length === 0
          : queries.mathProblems.length === 0;

        if (shouldPopulate && !player.components.timers.problemSpawn?.active) {
          populateFullGrid(ecs, queries.allPositions, gameMode, currentLevel);
          player.components.timers.problemSpawn = createTimer(GAME_CONFIG.TIMING.SHORT_DELAY / 1000);
        }

        updateEquationStateFromBoard(ecs, queries.mathProblems, gameMode, currentLevel);
        checkLevelCompletion(player, queries.mathProblems, gameMode, currentLevel);
      }
      cleanupConsumedProblems(ecs, queries.mathProblems);
    });
}

/**
 * Populate the entire grid with math problems
 */
function populateFullGrid(
  ecs: GameEngine,
  allPositionEntities: PositionEntity[],
  gameMode: Resources['gameMode'],
  currentLevel: number,
): void {
  const allProblems = problemsForMode(ecs, gameMode, currentLevel);
  
  // Get ALL grid positions that don't already have math problems
  const availablePositions = getAllGridPositionsWithoutMathProblems(allPositionEntities);
  
  const problemsToPlace = Math.min(allProblems.length, availablePositions.length);

  allProblems.slice(0, problemsToPlace).forEach((problem, i) => {
    const gridPos = availablePositions[i];
    const pixelPos = gridToPixel(gridPos.x, gridPos.y);
    
    createMathProblem(
      ecs.commands,
      pixelPos.x,
      pixelPos.y,
      problem.value,
      problem.isCorrect,
      1
    );
  });
  
  console.log(`Populated grid with ${problemsToPlace} problems for ${gameMode} level ${currentLevel} - ALL grid positions filled`);
}

const problemsForMode = (
  ecs: GameEngine,
  gameMode: Resources['gameMode'],
  currentLevel: number,
): ProblemPlacement[] => {
  if (gameMode === 'multiples') {
    return generateMultiplesProblems(currentLevel, PROBLEM_CONFIG.TOTAL_PROBLEMS);
  }

  const range = ecs.getResource('equationMode').valueRange;
  return Array.from({ length: PROBLEM_CONFIG.TOTAL_PROBLEMS }, () => ({
    value: randomEquationValue(range),
  }));
};

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
 * Check if all correct answers have been consumed (level completion).
 *
 * Triggers a `setScreen('playing', { level: nextLevel })` round-trip — the
 * exit clears playing-scoped entities (problems, enemies, webs)
 * and the re-entry rebuilds the board via `bootstrap.ts`'s screen hook.
 * The player entity is unscoped, so score and lives persist into the new level.
 */
function checkLevelCompletion(
  player: PlayerEntity,
  mathProblems: MathProblemEntityWithRenderable[],
  gameMode: Resources['gameMode'],
  currentLevel: number,
): void {
  if (gameMode === 'equations') {
    checkEquationLevelCompletion(player, mathProblems, currentLevel);
    return;
  }

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

    // Skip the SHORT_DELAY debounce so the next tick repopulates immediately on re-entry.
    delete player.components.timers.problemSpawn;

    void gameEngine.setScreen('playing', { level: nextLevel, isFreshGame: false });
  }
}

function activeEquationProblems(mathProblems: MathProblemEntityWithRenderable[]): MathProblemEntityWithRenderable[] {
  return mathProblems.filter(problem => !problem.components.mathProblem.consumed);
}

function updateEquationStateFromBoard(
  ecs: GameEngine,
  mathProblems: MathProblemEntityWithRenderable[],
  gameMode: Resources['gameMode'],
  currentLevel: number,
): void {
  if (gameMode !== 'equations') return;

  const currentState = ecs.getResource('equationMode');
  const state = currentState.level === currentLevel
    ? currentState
    : createEquationModeState(currentLevel);

  if (state.target !== 0) return;

  const candidate = chooseEquationCandidate(
    state.operation,
    activeEquationProblems(mathProblems).map(problem => ({
      id: problem.id,
      value: problem.components.mathProblem.value,
    })),
  );

  if (!candidate) return;

  ecs.setResource('equationMode', {
    ...state,
    target: candidate.target,
    selectedProblemIds: [],
  });
}

function checkEquationLevelCompletion(
  player: PlayerEntity,
  mathProblems: MathProblemEntityWithRenderable[],
  currentLevel: number,
): void {
  const equationMode = gameEngine.getResource('equationMode');
  const activeCount = activeEquationProblems(mathProblems).length;
  const shouldAdvance = equationMode.clearedThisLevel >= 10
    || (mathProblems.length > 0 && activeCount < equationMode.operandsRequired);

  if (!shouldAdvance) return;

  const nextLevel = currentLevel + 1;
  console.log(`Equation level ${currentLevel} completed. Advancing to level ${nextLevel}`);
  delete player.components.timers.problemSpawn;
  gameEngine.setResource('equationMode', createEquationModeState(nextLevel));
  void gameEngine.setScreen('playing', { level: nextLevel, isFreshGame: false });
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

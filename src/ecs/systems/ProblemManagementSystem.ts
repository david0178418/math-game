import { gameEngine, EntityFactory } from '../Engine';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../../game/config';
import { gridToPixel } from './MovementSystem';
import { mathProblemGenerator } from '../../game/MathProblemGenerator';
import { createQueryDefinition, type QueryResultEntity } from 'ecspresso';
import type { Components } from '../Engine';

/**
 * Problem Management System
 * Manages the lifecycle of math problems: spawning, tracking, and replacing consumed ones
 */

// Create reusable query definitions
const mathProblemQuery = createQueryDefinition({
  with: ['mathProblem', 'position', 'renderable']
});

const playerQuery = createQueryDefinition({
  with: ['player']
});

const allPositionsQuery = createQueryDefinition({
  with: ['position']
});

const enemyQuery = createQueryDefinition({
  with: ['enemy', 'position']
});

// Extract entity types using ECSpresso utilities
type MathProblemEntity = QueryResultEntity<Components, typeof mathProblemQuery>;
type PositionEntity = QueryResultEntity<Components, typeof allPositionsQuery>;
type EnemyEntity = QueryResultEntity<Components, typeof enemyQuery>;

// Configuration for problem management
const PROBLEM_CONFIG = {
  TOTAL_PROBLEMS: 30,        // Total problems needed to fill entire 6x5 grid
  SPAWN_DELAY: 1000,         // Milliseconds between spawn attempts
} as const;

let lastSpawnTime = 0;

// Add the problem management system to ECSpresso
export function addProblemManagementSystemToEngine(): void {
  gameEngine.addSystem('problemManagementSystem')
    .setPriority(30) // Lower priority, runs after collision detection
    .addQuery('mathProblems', mathProblemQuery)
    .addQuery('players', playerQuery)
    .addQuery('allPositions', allPositionsQuery)
    .addQuery('enemies', enemyQuery)
    .setProcess((queries) => {
      // Count active (non-consumed) problems
      const activeProblems = queries.mathProblems.filter(
        problem => !problem.components.mathProblem.consumed
      );
      
      // Check if we need to populate the grid initially or after level completion
      const currentTime = performance.now();
      if (activeProblems.length === 0 && 
          currentTime - lastSpawnTime > PROBLEM_CONFIG.SPAWN_DELAY) {
        
        // Adjust difficulty based on player score
        const player = queries.players[0];
        if (player) {
          adjustDifficultyBasedOnScore(player.components.player.score);
        }
        
        // Populate entire grid with problems
        populateFullGrid(queries.allPositions);
        
        lastSpawnTime = currentTime;
      }
      
      // Check for level completion in multiples mode
      checkLevelCompletion(queries.mathProblems, queries.enemies);
      
      // Clean up old consumed problems (optional optimization)
      cleanupConsumedProblems(queries.mathProblems);
    })
    .build();
}

/**
 * Populate the entire grid with math problems
 */
function populateFullGrid(allPositionEntities: PositionEntity[]): void {
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
      const gridX = Math.round(position.x / CELL_SIZE);
      const gridY = Math.round(position.y / CELL_SIZE);
      mathProblemPositions.add(`${gridX},${gridY}`);
    }
  }
  
  // Get all positions that don't have math problems yet
  const availablePositions: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
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
  if (score < 50) {
    mathProblemGenerator.setDifficulty('EASY');
  } else if (score < 200) {
    mathProblemGenerator.setDifficulty('MEDIUM');
  } else {
    mathProblemGenerator.setDifficulty('HARD');
  }
}

/**
 * Check if all correct answers have been consumed (level completion)
 */
function checkLevelCompletion(mathProblems: MathProblemEntity[], enemies: EnemyEntity[]): void {
  const gameMode = gameEngine.getResource('gameMode');
  const currentLevel = gameEngine.getResource('currentLevel');
  
  if (gameMode !== 'multiples') return;
  
  // Get all problems that should be correct for this level
  const correctMultiples: number[] = [];
  for (let i = 1; i <= 12; i++) {
    correctMultiples.push(currentLevel * i);
  }
  
  // Check if all correct multiples have been consumed
  const correctProblemsOnBoard = mathProblems.filter(problem => {
    const mathProblem = problem.components.mathProblem;
    return correctMultiples.includes(mathProblem.value) && mathProblem.isCorrect;
  });
  
  const allCorrectConsumed = correctProblemsOnBoard.every(problem => 
    problem.components.mathProblem.consumed
  );
  
  if (allCorrectConsumed && correctProblemsOnBoard.length > 0) {
    // Level completed! Advance to next level
    const nextLevel = currentLevel + 1;
    
    console.log(`🎉 Level ${currentLevel} completed! Advancing to multiples of ${nextLevel}`);
    
    // Update level and show completion message
    gameEngine.addResource('currentLevel', nextLevel);
    
    // Clear ALL math problems (consumed and non-consumed)
    mathProblems.forEach(problem => {
      gameEngine.entityManager.removeEntity(problem.id);
    });
    
    // Clear all enemies to start fresh for the new level
    enemies.forEach((enemy) => {
      gameEngine.entityManager.removeEntity(enemy.id);
    });
    
    // Force immediate grid repopulation by resetting last spawn time
    lastSpawnTime = 0;
    
    // Update UI to show new level
    updateLevelDisplay();
    
    console.log(`Board completely reset for multiples of ${nextLevel}`);
  }
}

/**
 * Update the level display in the UI
 */
function updateLevelDisplay(): void {
  const currentLevel = gameEngine.getResource('currentLevel');
  const objectiveDisplay = document.getElementById('objective-display');
  
  if (objectiveDisplay) {
    objectiveDisplay.textContent = `Find multiples of ${currentLevel}!`;
  }
}

/**
 * Clean up consumed problems that are no longer visible
 */
function cleanupConsumedProblems(mathProblems: MathProblemEntity[]): void {
  const consumedProblems = mathProblems.filter(
    problem => problem.components.mathProblem.consumed &&
               problem.components.renderable.size === 0
  );
  
  // Remove consumed problems if we have too many total problems
  if (mathProblems.length > PROBLEM_CONFIG.TOTAL_PROBLEMS) {
    consumedProblems.forEach(problem => {
      gameEngine.entityManager.removeEntity(problem.id);
    });
  }
} 
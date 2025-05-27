import { gameEngine, EntityFactory } from '../Engine';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../../game/config';
import { gridToPixel } from './MovementSystem';
import { mathProblemGenerator } from '../../game/MathProblemGenerator';

/**
 * Problem Management System
 * Manages the lifecycle of math problems: spawning, tracking, and replacing consumed ones
 */

// Configuration for problem management
const PROBLEM_CONFIG = {
  TOTAL_PROBLEMS: 25,        // Total problems needed to fill 6x5 grid (30 - 1 player - 4 enemies)
  SPAWN_DELAY: 1000,         // Milliseconds between spawn attempts
} as const;

let lastSpawnTime = 0;

// Add the problem management system to ECSpresso
export function addProblemManagementSystemToEngine(): void {
  gameEngine.addSystem('problemManagementSystem')
    .setPriority(30) // Lower priority, runs after collision detection
    .addQuery('mathProblems', {
      with: ['mathProblem', 'position']
    })
    .addQuery('players', {
      with: ['player']
    })
    .addQuery('allPositions', {
      with: ['position']
    })
    .addQuery('enemies', {
      with: ['enemy', 'position']
    })
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
function populateFullGrid(allPositionEntities: any[]): void {
  const gameMode = gameEngine.getResource('gameMode');
  const currentLevel = gameEngine.getResource('currentLevel');
  
  if (gameMode !== 'multiples') return;
  
  // Get all problems needed for this level
  const allProblems = mathProblemGenerator.generateMultiplesProblems(currentLevel, PROBLEM_CONFIG.TOTAL_PROBLEMS);
  
  // Get all empty grid positions
  const emptyPositions = getAllEmptyGridPositions(allPositionEntities);
  
  // Place problems in empty positions
  const problemsToPlace = Math.min(allProblems.length, emptyPositions.length);
  
  for (let i = 0; i < problemsToPlace; i++) {
    const problem = allProblems[i];
    const gridPos = emptyPositions[i];
    const pixelPos = gridToPixel(gridPos.x, gridPos.y);
    
    EntityFactory.createMathProblem(
      pixelPos.x,
      pixelPos.y,
      problem.value,
      problem.isCorrect,
      1
    );
  }
  
  console.log(`Populated grid with ${problemsToPlace} problems for multiples of ${currentLevel}`);
}

/**
 * Get all empty grid positions
 */
function getAllEmptyGridPositions(allPositionEntities: any[]): { x: number; y: number }[] {
  const occupiedPositions = new Set<string>();
  
  // Get all occupied positions from entities with position components
  for (const entity of allPositionEntities) {
    const position = entity.components.position;
    if (position) {
      const gridX = Math.round(position.x / CELL_SIZE);
      const gridY = Math.round(position.y / CELL_SIZE);
      occupiedPositions.add(`${gridX},${gridY}`);
    }
  }
  
  // Get all empty positions
  const emptyPositions: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const key = `${x},${y}`;
      if (!occupiedPositions.has(key)) {
        emptyPositions.push({ x, y });
      }
    }
  }
  
  return emptyPositions;
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
function checkLevelCompletion(mathProblems: any[], enemies: any[]): void {
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
    enemies.forEach((enemy: any) => {
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
function cleanupConsumedProblems(mathProblems: any[]): void {
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
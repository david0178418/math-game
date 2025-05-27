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
  MIN_PROBLEMS: 8,           // Minimum number of problems on screen
  MAX_PROBLEMS: 12,          // Maximum number of problems on screen
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
    .setProcess((queries) => {
      // Count active (non-consumed) problems
      const activeProblems = queries.mathProblems.filter(
        problem => !problem.components.mathProblem.consumed
      );
      
      // Check if we need to spawn new problems
      const currentTime = performance.now();
      if (activeProblems.length < PROBLEM_CONFIG.MIN_PROBLEMS && 
          currentTime - lastSpawnTime > PROBLEM_CONFIG.SPAWN_DELAY) {
        
        // Adjust difficulty based on player score
        const player = queries.players[0];
        if (player) {
          adjustDifficultyBasedOnScore(player.components.player.score);
        }
        
        // Spawn new problems
        const problemsToSpawn = PROBLEM_CONFIG.MIN_PROBLEMS - activeProblems.length;
        for (let i = 0; i < problemsToSpawn; i++) {
          spawnRandomProblem(queries.allPositions);
        }
        
        lastSpawnTime = currentTime;
      }
      
      // Clean up old consumed problems (optional optimization)
      cleanupConsumedProblems(queries.mathProblems);
    })
    .build();
}

/**
 * Spawn a new random math problem at an empty grid position
 */
function spawnRandomProblem(allPositionEntities: any[]): void {
  const problem = mathProblemGenerator.generateProblem();
  const options = mathProblemGenerator.generateOptions(problem, 4);
  
  // Find an empty grid position
  const emptyPosition = findEmptyGridPosition(allPositionEntities);
  if (!emptyPosition) {
    console.warn('No empty positions available for new problem');
    return;
  }
  
  // Randomly select one of the options to place
  const selectedOption = options[Math.floor(Math.random() * options.length)];
  const pixelPos = gridToPixel(emptyPosition.x, emptyPosition.y);
  
  // Create the math problem entity
  EntityFactory.createMathProblem(
    pixelPos.x,
    pixelPos.y,
    selectedOption.value,
    selectedOption.isCorrect,
    problem.difficulty
  );
  
  console.log(`Spawned problem: ${problem.question} = ${selectedOption.value} (${selectedOption.isCorrect ? 'correct' : 'incorrect'})`);
}

/**
 * Find an empty grid position that doesn't collide with existing entities
 */
function findEmptyGridPosition(allPositionEntities: any[]): { x: number; y: number } | null {
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
  
  // Find empty positions (try random positions first)
  const maxAttempts = 50;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = Math.floor(Math.random() * GRID_WIDTH);
    const y = Math.floor(Math.random() * GRID_HEIGHT);
    const key = `${x},${y}`;
    
    if (!occupiedPositions.has(key)) {
      return { x, y };
    }
  }
  
  // If random search fails, do systematic search
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const key = `${x},${y}`;
      if (!occupiedPositions.has(key)) {
        return { x, y };
      }
    }
  }
  
  return null; // No empty positions found
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
 * Clean up consumed problems that are no longer visible
 */
function cleanupConsumedProblems(mathProblems: any[]): void {
  const consumedProblems = mathProblems.filter(
    problem => problem.components.mathProblem.consumed &&
               problem.components.renderable.size === 0
  );
  
  // Remove consumed problems if we have too many total problems
  if (mathProblems.length > PROBLEM_CONFIG.MAX_PROBLEMS) {
    consumedProblems.forEach(problem => {
      gameEngine.entityManager.removeEntity(problem.id);
    });
  }
} 
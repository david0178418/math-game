import ECSpresso from 'ecspresso';
import { GAME_CONFIG, CELL_SIZE, PLAYER_LIVES, STARTING_SCORE } from '../game/config';

// Re-export for convenience
export { GAME_CONFIG };

// Define component type interfaces
interface Components {
  position: { x: number; y: number };
  renderable: { 
    shape: 'circle' | 'rectangle'; 
    color: string; 
    size: number;
    layer: number;
  };
  player: { 
    score: number; 
    lives: number; 
    inputState: { up: boolean; down: boolean; left: boolean; right: boolean; eat: boolean };
  };
  enemy: { 
    behaviorType: 'chase' | 'patrol' | 'random' | 'guard';
    nextMoveTime: number;
    aiState?: any;
    waypoints?: Array<{ x: number, y: number }>;
    currentWaypoint?: number;
    guardPosition?: { x: number, y: number };
  };
  mathProblem: { 
    value: number; 
    isCorrect: boolean; 
    difficulty: number; 
    consumed: boolean;
  };
  collider: { 
    width: number; 
    height: number; 
    group: string;
  };
  health: { 
    current: number; 
    max: number; 
    invulnerable: boolean; 
    invulnerabilityTime: number;
  };
}

// Define event types (for future use)
interface Events {
  playerMoved: { x: number; y: number };
  problemSolved: { value: number; correct: boolean };
  enemyCollision: { playerId: number; enemyId: number };
}

// Define resource types (for future use)
interface Resources {
  gameState: 'menu' | 'playing' | 'paused' | 'gameOver';
  score: { value: number };
  gameMode: string;
  currentLevel: number;
}

// Create and configure the ECSpresso engine
export const gameEngine = ECSpresso.create<Components, Events, Resources>().build();

// Game loop state
let lastFrameTime = 0;
let gameRunning = false;

/**
 * Initialize the game engine with default configuration
 */
export function initializeEngine(): void {
  // Add initial resources
  gameEngine.addResource('gameState', 'menu');
  gameEngine.addResource('score', { value: STARTING_SCORE });

  console.log('ECSpresso engine initialized');
}

/**
 * Start the game loop
 */
export function startGameLoop(): void {
  if (gameRunning) return;
  
  gameRunning = true;
  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
  console.log('Game loop started');
}

/**
 * Stop the game loop
 */
export function stopGameLoop(): void {
  gameRunning = false;
  console.log('Game loop stopped');
}

/**
 * Main game loop using requestAnimationFrame
 */
function gameLoop(currentTime: number): void {
  if (!gameRunning) return;

  const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
  lastFrameTime = currentTime;

  // Update all systems
  gameEngine.update(deltaTime);

  // Continue the loop
  requestAnimationFrame(gameLoop);
}

/**
 * Get the game engine instance
 */
export function getEngine(): ECSpresso<Components, Events, Resources> {
  return gameEngine;
}

/**
 * Entity factory for creating common game objects
 */
export const EntityFactory = {
  createPlayer(x: number, y: number): { id: number } {
    const entity = gameEngine.entityManager.createEntity();
    
    gameEngine.entityManager.addComponent(entity.id, 'position', { x, y });
    gameEngine.entityManager.addComponent(entity.id, 'renderable', { 
      shape: 'circle', 
      color: GAME_CONFIG.COLORS.PLAYER, 
      size: CELL_SIZE * GAME_CONFIG.SIZES.PLAYER,
      layer: GAME_CONFIG.LAYERS.ENTITIES 
    });
    gameEngine.entityManager.addComponent(entity.id, 'player', { 
      score: STARTING_SCORE, 
      lives: PLAYER_LIVES, 
      inputState: { up: false, down: false, left: false, right: false, eat: false } 
    });
    gameEngine.entityManager.addComponent(entity.id, 'collider', { 
      width: CELL_SIZE * GAME_CONFIG.SIZES.PLAYER, 
      height: CELL_SIZE * GAME_CONFIG.SIZES.PLAYER, 
      group: 'player' 
    });
    gameEngine.entityManager.addComponent(entity.id, 'health', { 
      current: PLAYER_LIVES, 
      max: PLAYER_LIVES, 
      invulnerable: false, 
      invulnerabilityTime: 0 
    });

    return entity;
  },

  createEnemy(x: number, y: number, behaviorType: 'chase' | 'patrol' | 'random' | 'guard' = 'random'): { id: number } {
    const entity = gameEngine.entityManager.createEntity();
    
    gameEngine.entityManager.addComponent(entity.id, 'position', { x, y });
    gameEngine.entityManager.addComponent(entity.id, 'renderable', { 
      shape: 'rectangle', 
      color: GAME_CONFIG.COLORS.ENEMY, 
      size: CELL_SIZE * GAME_CONFIG.SIZES.ENEMY,
      layer: GAME_CONFIG.LAYERS.ENTITIES 
    });
    gameEngine.entityManager.addComponent(entity.id, 'enemy', { 
      behaviorType,
      nextMoveTime: 0
    });
    gameEngine.entityManager.addComponent(entity.id, 'collider', { 
      width: CELL_SIZE * GAME_CONFIG.SIZES.ENEMY, 
      height: CELL_SIZE * GAME_CONFIG.SIZES.ENEMY, 
      group: 'enemy' 
    });
    gameEngine.entityManager.addComponent(entity.id, 'health', { 
      current: 1, 
      max: 1, 
      invulnerable: false, 
      invulnerabilityTime: 0 
    });

    return entity;
  },

  createMathProblem(x: number, y: number, value: number, isCorrect: boolean, difficulty: number = 1): { id: number } {
    const entity = gameEngine.entityManager.createEntity();
    
    gameEngine.entityManager.addComponent(entity.id, 'position', { x, y });
    gameEngine.entityManager.addComponent(entity.id, 'renderable', { 
      shape: 'rectangle', 
      color: GAME_CONFIG.COLORS.MATH_PROBLEM, 
      size: CELL_SIZE * GAME_CONFIG.SIZES.MATH_PROBLEM,
      layer: GAME_CONFIG.LAYERS.MATH_PROBLEMS
    });
    gameEngine.entityManager.addComponent(entity.id, 'mathProblem', { 
      value, 
      isCorrect, 
      difficulty, 
      consumed: false 
    });
    gameEngine.entityManager.addComponent(entity.id, 'collider', { 
      width: CELL_SIZE * GAME_CONFIG.SIZES.MATH_PROBLEM, 
      height: CELL_SIZE * GAME_CONFIG.SIZES.MATH_PROBLEM, 
      group: 'problem' 
    });

    return entity;
  }
}; 
import ECSpresso from 'ecspresso';

// Game configuration constants
export const GAME_CONFIG = {
  GRID_WIDTH: 20,
  GRID_HEIGHT: 20,
  CELL_SIZE: 32,
  TARGET_FPS: 60,
  PLAYER_SPEED: 4,
  ENEMY_SPEED: 2,
} as const;

// Define component type interfaces
interface Components {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  renderable: { 
    shape: 'circle' | 'rectangle'; 
    color: string; 
    size: number;
    layer: number;
  };
  player: { 
    score: number; 
    lives: number; 
    inputState: { up: boolean; down: boolean; left: boolean; right: boolean };
  };
  enemy: { 
    aiType: string; 
    state: string; 
    targetX: number; 
    targetY: number;
    speed: number;
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

// Define event types (empty for now, can be extended later)
interface Events {
  playerMoved: { x: number; y: number };
  problemSolved: { value: number; correct: boolean };
  enemyCollision: { playerId: number; enemyId: number };
}

// Define resource types (empty for now, can be extended later)
interface Resources {
  gameState: 'menu' | 'playing' | 'paused' | 'gameOver';
  score: { value: number };
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
  gameEngine.addResource('score', { value: 0 });

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
 * Create entity factory for common game objects
 */
export const EntityFactory = {
  createPlayer(x: number, y: number): { id: number } {
    const entity = gameEngine.entityManager.createEntity();
    
    gameEngine.entityManager.addComponent(entity.id, 'position', { x, y });
    gameEngine.entityManager.addComponent(entity.id, 'velocity', { x: 0, y: 0 });
    gameEngine.entityManager.addComponent(entity.id, 'renderable', { 
      shape: 'circle', 
      color: 'blue', 
      size: GAME_CONFIG.CELL_SIZE * 0.8,
      layer: 2 
    });
    gameEngine.entityManager.addComponent(entity.id, 'player', { 
      score: 0, 
      lives: 3, 
      inputState: { up: false, down: false, left: false, right: false } 
    });
    gameEngine.entityManager.addComponent(entity.id, 'collider', { 
      width: GAME_CONFIG.CELL_SIZE * 0.8, 
      height: GAME_CONFIG.CELL_SIZE * 0.8, 
      group: 'player' 
    });
    gameEngine.entityManager.addComponent(entity.id, 'health', { 
      current: 3, 
      max: 3, 
      invulnerable: false, 
      invulnerabilityTime: 0 
    });

    return entity;
  },

  createEnemy(x: number, y: number, aiType: string = 'random'): { id: number } {
    const entity = gameEngine.entityManager.createEntity();
    
    gameEngine.entityManager.addComponent(entity.id, 'position', { x, y });
    gameEngine.entityManager.addComponent(entity.id, 'velocity', { x: 0, y: 0 });
    gameEngine.entityManager.addComponent(entity.id, 'renderable', { 
      shape: 'rectangle', 
      color: 'red', 
      size: GAME_CONFIG.CELL_SIZE * 0.9,
      layer: 2 
    });
    gameEngine.entityManager.addComponent(entity.id, 'enemy', { 
      aiType, 
      state: 'idle', 
      targetX: x, 
      targetY: y,
      speed: GAME_CONFIG.ENEMY_SPEED
    });
    gameEngine.entityManager.addComponent(entity.id, 'collider', { 
      width: GAME_CONFIG.CELL_SIZE * 0.9, 
      height: GAME_CONFIG.CELL_SIZE * 0.9, 
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
      color: isCorrect ? 'green' : 'lightgray', 
      size: GAME_CONFIG.CELL_SIZE * 0.9,
      layer: 1
    });
    gameEngine.entityManager.addComponent(entity.id, 'mathProblem', { 
      value, 
      isCorrect, 
      difficulty, 
      consumed: false 
    });
    gameEngine.entityManager.addComponent(entity.id, 'collider', { 
      width: GAME_CONFIG.CELL_SIZE * 0.9, 
      height: GAME_CONFIG.CELL_SIZE * 0.9, 
      group: 'problem' 
    });

    return entity;
  }
}; 
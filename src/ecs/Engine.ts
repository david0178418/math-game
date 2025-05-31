import ECSpresso from 'ecspresso';
import { GAME_CONFIG, CELL_SIZE, PLAYER_LIVES, STARTING_SCORE } from '../game/config';

// Re-export for convenience
export { GAME_CONFIG };

// Define component type interfaces
export interface Components {
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
    aiState?: {
      targetGridX: number;
      targetGridY: number;
      path: Array<{ x: number, y: number }>;
      pathIndex: number;
      lastPathUpdate: number;
    };
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
export interface Events {
  playerMoved: { x: number; y: number };
  problemSolved: { value: number; correct: boolean };
  enemyCollision: { playerId: number; enemyId: number };
}

// Define resource types (for future use)
export interface Resources {
  gameState: 'menu' | 'playing' | 'paused' | 'gameOver';
  score: { value: number };
  gameMode: string;
  currentLevel: number;
}

// Create and configure the ECSpresso engine using new constructor pattern
export const gameEngine = new ECSpresso<Components, Events, Resources>();

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

  // Set up event handlers
  setupEventHandlers();

  // Set up component callbacks
  setupComponentCallbacks();

  console.log('ECSpresso engine initialized');
}

/**
 * Set up event handlers for game events
 */
function setupEventHandlers(): void {
  // Handle player movement events
  gameEngine.eventBus.subscribe('playerMoved', (event) => {
    // Could be used for sound effects, particle effects, etc.
    console.debug(`Player moved to (${event.x}, ${event.y})`);
  });

  // Handle problem solved events
  gameEngine.eventBus.subscribe('problemSolved', (event) => {
    if (event.correct) {
      console.log(`✅ Correct answer: ${event.value}`);
      // Could trigger positive sound effects, visual feedback, etc.
    } else {
      console.log(`❌ Wrong answer: ${event.value}`);
      // Could trigger negative sound effects, screen shake, etc.
    }
  });

  // Handle enemy collision events
  gameEngine.eventBus.subscribe('enemyCollision', (event) => {
    console.log(`💥 Player ${event.playerId} hit by enemy ${event.enemyId}`);
    // Could trigger damage effects, screen flash, etc.
  });

  console.log('Event handlers initialized');
}

/**
 * Set up component callbacks for debugging and monitoring
 */
function setupComponentCallbacks(): void {
  // Monitor player component changes
  gameEngine.entityManager.onComponentAdded('player', (value, entity) => {
    console.log(`🎮 Player component added to entity ${entity.id}:`, value);
  });

  gameEngine.entityManager.onComponentRemoved('player', (oldValue, entity) => {
    console.log(`🎮 Player component removed from entity ${entity.id}:`, oldValue);
  });

  // Monitor enemy spawning/despawning
  gameEngine.entityManager.onComponentAdded('enemy', (value, entity) => {
    console.log(`👾 Enemy spawned (entity ${entity.id}):`, value);
  });

  gameEngine.entityManager.onComponentRemoved('enemy', (oldValue, entity) => {
    console.log(`👾 Enemy despawned (entity ${entity.id}):`, oldValue);
  });

  // Monitor math problem lifecycle
  gameEngine.entityManager.onComponentAdded('mathProblem', (value, entity) => {
    console.log(`🔢 Math problem created (entity ${entity.id}):`, value);
  });

  gameEngine.entityManager.onComponentRemoved('mathProblem', (oldValue, entity) => {
    console.log(`🔢 Math problem removed (entity ${entity.id}):`, oldValue);
  });

  console.log('Component callbacks initialized');
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
    const entity = gameEngine.spawn({
      position: { x, y },
      renderable: { 
        shape: 'circle', 
        color: GAME_CONFIG.COLORS.PLAYER, 
        size: CELL_SIZE * GAME_CONFIG.SIZES.PLAYER,
        layer: GAME_CONFIG.LAYERS.ENTITIES 
      },
      player: { 
        score: STARTING_SCORE, 
        lives: PLAYER_LIVES, 
        inputState: { up: false, down: false, left: false, right: false, eat: false } 
      },
      collider: { 
        width: CELL_SIZE * GAME_CONFIG.SIZES.PLAYER, 
        height: CELL_SIZE * GAME_CONFIG.SIZES.PLAYER, 
        group: 'player' 
      },
      health: { 
        current: PLAYER_LIVES, 
        max: PLAYER_LIVES, 
        invulnerable: false, 
        invulnerabilityTime: 0 
      }
    });

    return entity;
  },

  createEnemy(x: number, y: number, behaviorType: 'chase' | 'patrol' | 'random' | 'guard' = 'random'): { id: number } {
    const entity = gameEngine.spawn({
      position: { x, y },
      renderable: { 
        shape: 'rectangle', 
        color: GAME_CONFIG.COLORS.ENEMY, 
        size: CELL_SIZE * GAME_CONFIG.SIZES.ENEMY,
        layer: GAME_CONFIG.LAYERS.ENTITIES 
      },
      enemy: { 
        behaviorType,
        nextMoveTime: 0
      },
      collider: { 
        width: CELL_SIZE * GAME_CONFIG.SIZES.ENEMY, 
        height: CELL_SIZE * GAME_CONFIG.SIZES.ENEMY, 
        group: 'enemy' 
      },
      health: { 
        current: 1, 
        max: 1, 
        invulnerable: false, 
        invulnerabilityTime: 0 
      }
    });

    return entity;
  },

  createMathProblem(x: number, y: number, value: number, isCorrect: boolean, difficulty: number = 1): { id: number } {
    const entity = gameEngine.spawn({
      position: { x, y },
      renderable: { 
        shape: 'rectangle', 
        color: GAME_CONFIG.COLORS.MATH_PROBLEM, 
        size: CELL_SIZE * GAME_CONFIG.SIZES.MATH_PROBLEM,
        layer: GAME_CONFIG.LAYERS.MATH_PROBLEMS
      },
      mathProblem: { 
        value, 
        isCorrect, 
        difficulty, 
        consumed: false 
      },
      collider: { 
        width: CELL_SIZE * GAME_CONFIG.SIZES.MATH_PROBLEM, 
        height: CELL_SIZE * GAME_CONFIG.SIZES.MATH_PROBLEM, 
        group: 'problem' 
      }
    });

    return entity;
  }
}; 
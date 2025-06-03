import ECSpresso from 'ecspresso';
import { GAME_CONFIG, CELL_SIZE, PLAYER_LIVES, STARTING_SCORE } from '../game/config';
import flyImage from '../assets/images/fly.svg';

// Re-export for convenience
export { GAME_CONFIG };

// Define component type interfaces
export interface Components {
  position: { 
    x: number; 
    y: number;
    // Animation properties for smooth grid movement
    targetX?: number;
    targetY?: number;
    isAnimating?: boolean;
    animationStartTime?: number;
    animationDuration?: number;
    animationStartX?: number;
    animationStartY?: number;
    // Rotation properties for directional sprites
    rotation?: number; // Current rotation in degrees (0 = up, 90 = right, 180 = down, 270 = left)
    targetRotation?: number;
    rotationStartTime?: number;
    rotationDuration?: number;
    startRotation?: number;
    // Shake properties for damage/error feedback
    shakeIntensity?: number;
    shakeDuration?: number;
    shakeStartTime?: number;
    shakeOffsetX?: number;
    shakeOffsetY?: number;
  };
  renderable: { 
    shape: 'circle' | 'rectangle' | 'image'; 
    color: string; 
    size: number;
    layer: number;
    // Image-specific properties
    imageSrc?: string;
    imageWidth?: number;
    imageHeight?: number;
  };
  player: { 
    score: number; 
    lives: number; 
    inputState: { up: boolean; down: boolean; left: boolean; right: boolean; eat: boolean };
    gameOverPending?: boolean; // Flag to disable controls during game over delay
    // Death animation properties
    deathAnimationActive?: boolean;
    deathAnimationStartTime?: number;
    deathAnimationDuration?: number;
    deathScale?: number; // Scale factor for shrinking effect
  };
  enemy: { 
    enemyType: 'lizard' | 'spider' | 'frog';
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
  spiderWeb: {
    duration: number;        // Time until web disappears (8000ms)
    freezeTime: number;      // Time player is frozen when caught (2000ms)
    createdTime: number;     // When the web was created (timestamp)
    isActive: boolean;       // Whether the web is still active
  };
  freezeEffect: {
    startTime: number;       // When freeze started
    duration: number;        // How long to freeze (2000ms)
    isActive: boolean;       // Whether player is currently frozen
    sourceWebId?: number;    // ID of the spider web that caused this freeze
  };
  frogTongue: {
    isExtended: boolean;                    // Whether tongue is currently out
    direction: { x: number; y: number };    // Direction tongue extends
    maxRange: number;                       // Maximum tiles (3)
    currentLength: number;                  // Current extension distance
    startTime: number;                      // When tongue action started
    phase: 'extending' | 'holding' | 'retracting' | 'idle';
    segments: Array<{ x: number; y: number }>; // Tongue path for collision
  };
}

// Define event types for type safety
export interface Events {
  playerMoved: { x: number; y: number };
  problemSolved: { value: number; correct: boolean };
  enemyCollision: { playerId: number; enemyId: number };
  tongueCollision: { playerId: number; tongueId: number };
  scoreChanged: { newScore: number; oldScore: number };
  livesChanged: { newLives: number; oldLives: number };
  enemyKilled: { x: number; y: number };
  difficultyChanged: { newDifficulty: string };
  animationComplete: { entityId: number; x: number; y: number };
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
      position: { x, y, rotation: 0 },
      renderable: { 
        shape: 'image', 
        color: GAME_CONFIG.COLORS.PLAYER, // Fallback color if image fails to load
        size: CELL_SIZE * GAME_CONFIG.SIZES.PLAYER,
        layer: GAME_CONFIG.LAYERS.PLAYER,
        imageSrc: flyImage
      },
      player: { 
        score: STARTING_SCORE, 
        lives: PLAYER_LIVES, 
        inputState: { up: false, down: false, left: false, right: false, eat: false },
        gameOverPending: false,
        deathAnimationActive: false,
        deathScale: 1.0
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

  createEnemy(x: number, y: number, enemyType: 'lizard' | 'spider' | 'frog' = 'lizard', behaviorType: 'chase' | 'patrol' | 'random' | 'guard' = 'random'): { id: number } {
    // Set type-specific visual properties
    let enemyColor: string;
    switch (enemyType) {
      case 'lizard':
        enemyColor = GAME_CONFIG.COLORS.ENEMY; // Red (existing enemy color)
        break;
      case 'spider':
        enemyColor = 'purple';
        break;
      case 'frog':
        enemyColor = 'green';
        break;
      default:
        enemyColor = GAME_CONFIG.COLORS.ENEMY;
    }

    const entity = gameEngine.spawn({
      position: { x, y },
      renderable: { 
        shape: 'rectangle', 
        color: enemyColor, 
        size: CELL_SIZE * GAME_CONFIG.SIZES.ENEMY,
        layer: GAME_CONFIG.LAYERS.ENTITIES 
      },
      enemy: { 
        enemyType,
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

  createLizard(x: number, y: number, behaviorType: 'chase' | 'patrol' | 'random' | 'guard' = 'random'): { id: number } {
    return this.createEnemy(x, y, 'lizard', behaviorType);
  },

  createSpider(x: number, y: number, behaviorType: 'chase' | 'patrol' | 'random' | 'guard' = 'random'): { id: number } {
    return this.createEnemy(x, y, 'spider', behaviorType);
  },

  createFrog(x: number, y: number, behaviorType: 'chase' | 'patrol' | 'random' | 'guard' = 'random'): { id: number } {
    return this.createEnemy(x, y, 'frog', behaviorType);
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
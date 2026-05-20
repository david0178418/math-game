import ECSpresso from 'ecspresso';
import { createInputPlugin } from 'ecspresso/plugins/input/input';
import { createTimerPlugin, createTimer, type Timer, type TimerComponentTypes } from 'ecspresso/plugins/scripting/timers';
import { createTweenPlugin, type TweenComponentTypes } from 'ecspresso/plugins/scripting/tween';
import {
  createCoroutinePlugin,
  type CoroutineComponentTypes,
} from 'ecspresso/plugins/scripting/coroutine';
import { SYSTEM_PRIORITIES } from './systemConfigs';

// Re-exported for query/spawn typing
export type AllComponents = Components
  & TimerComponentTypes<TimerSlot>
  & TweenComponentTypes
  & CoroutineComponentTypes;
import { GAME_CONFIG } from '../game/config';
import type { AIBehavior, EnemyType } from '../types/shared';
import flyImage from '../assets/images/fly.svg';

export type GameAction = 'up' | 'down' | 'left' | 'right' | 'eat';

export type TimerSlot =
  | 'webExpiry'
  | 'freeze'
  | 'invulnerability'
  | 'deathDelay'
  | 'enemyMove'
  | 'enemySpawn'
  | 'problemSpawn';

export type GameTimer = Timer<TimerSlot>;
export { createTimer };

const inputPlugin = createInputPlugin<GameAction>({
  actions: {
    up:    { keys: ['ArrowUp',    'w', 'W'] },
    down:  { keys: ['ArrowDown',  's', 'S'] },
    left:  { keys: ['ArrowLeft',  'a', 'A'] },
    right: { keys: ['ArrowRight', 'd', 'D'] },
    eat:   { keys: [' ', 'Enter'] },
  },
  preventDefaultKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '],
});

const timerPlugin = createTimerPlugin<TimerSlot>();
// Priority slots tween between movement and render so render reads the
// just-interpolated values, not last frame's.
const tweenPlugin = createTweenPlugin({ priority: SYSTEM_PRIORITIES.ANIMATION });
const coroutinePlugin = createCoroutinePlugin({ priority: SYSTEM_PRIORITIES.FROG_TONGUE });

// Re-export for convenience
export { GAME_CONFIG };

// Define component type interfaces
export interface Components {
  position: {
    x: number;
    y: number;
    // 0 = up, 90 = right, 180 = down, 270 = left
    rotation?: number;
  };
  shake: {
    intensity: number;
    duration: number;  // seconds
    elapsed: number;   // seconds
    offsetX: number;
    offsetY: number;
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
    gameOverPending?: boolean; // Flag to disable controls during game over delay
    deathScale: number;
  };
  enemy: {
    enemyType: EnemyType;
    behaviorType: AIBehavior;
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
  };
  spiderWeb: {
    freezeTime: number;
  };
  frogTongue: {
    direction: { x: number; y: number };
    maxRange: number;          // Maximum tiles (3)
    currentLength: number;
    segments: Array<{ x: number; y: number }>;
    phase: 'idle' | 'extending' | 'holding' | 'retracting';
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
}

export type PlayingScreenConfig = { level: number; isFreshGame: boolean };

export interface Resources {
  score: { value: number };
  gameMode: string;
  currentLevel: number;
}

export const gameEngine = ECSpresso.create()
  .withPlugin(inputPlugin)
  .withPlugin(timerPlugin)
  .withPlugin(tweenPlugin)
  .withPlugin(coroutinePlugin)
  .withComponentTypes<Components>()
  .withEventTypes<Events>()
  .withResourceTypes<Resources>()
  .withResource('score', { value: GAME_CONFIG.GAMEPLAY.STARTING_SCORE })
  .withResource('gameMode', 'multiples')
  .withResource('currentLevel', GAME_CONFIG.GAMEPLAY.STARTING_LEVEL)
  .withRequired('player', 'timers', () => ({}))
  .withRequired('player', 'health', (p) => ({ current: p.lives, max: p.lives }))
  .withRequired('enemy', 'timers', () => ({}))
  .withRequired('enemy', 'health', () => ({ current: 1, max: 1 }))
  .withScreens(screens => screens
    .add('menu', { initialState: () => ({}) })
    .add('playing', { initialState: (config: PlayingScreenConfig) => ({ ...config }) })
    .add('paused', { initialState: () => ({}) })
    .add('gameOver', { initialState: () => ({}) }))
  .build();

export type GameEngine = typeof gameEngine;

// Game loop state
let lastFrameTime = 0;
let gameRunning = false;

/**
 * Initialize the game engine with default configuration
 */
export async function initializeEngine(): Promise<void> {
  setupEventHandlers();

  await gameEngine.initialize();

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
export function getEngine(): GameEngine {
  return gameEngine;
}

type Commands = GameEngine['commands'];

const enemyColorFor = (enemyType: EnemyType): string =>
  GAME_CONFIG.ENEMY_TYPES[enemyType.toUpperCase() as keyof typeof GAME_CONFIG.ENEMY_TYPES]?.COLOR
  ?? GAME_CONFIG.COLORS.ENEMY;

const playerComponents = (x: number, y: number): Partial<AllComponents> => ({
  position: { x, y, rotation: 0 },
  renderable: {
    shape: 'image',
    color: GAME_CONFIG.COLORS.PLAYER,
    size: GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.SIZES.PLAYER,
    layer: GAME_CONFIG.LAYERS.PLAYER,
    imageSrc: flyImage
  },
  player: {
    score: GAME_CONFIG.GAMEPLAY.STARTING_SCORE,
    lives: GAME_CONFIG.GAMEPLAY.PLAYER_LIVES,
    gameOverPending: false,
    deathScale: 1.0
  },
  collider: {
    width: GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.SIZES.PLAYER,
    height: GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.SIZES.PLAYER,
    group: 'player'
  }
});

const enemyComponents = (
  x: number,
  y: number,
  enemyType: EnemyType,
  behaviorType: AIBehavior
): Partial<AllComponents> => ({
  position: { x, y },
  renderable: {
    shape: 'rectangle',
    color: enemyColorFor(enemyType),
    size: GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.SIZES.ENEMY,
    layer: GAME_CONFIG.LAYERS.ENTITIES
  },
  enemy: {
    enemyType,
    behaviorType
  },
  collider: {
    width: GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.SIZES.ENEMY,
    height: GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.SIZES.ENEMY,
    group: 'enemy'
  }
});

const mathProblemComponents = (
  x: number,
  y: number,
  value: number,
  isCorrect: boolean,
  difficulty: number
): Partial<AllComponents> => ({
  position: { x, y },
  renderable: {
    shape: 'rectangle',
    color: GAME_CONFIG.COLORS.MATH_PROBLEM,
    size: GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.SIZES.MATH_PROBLEM,
    layer: GAME_CONFIG.LAYERS.MATH_PROBLEMS
  },
  mathProblem: {
    value,
    isCorrect,
    difficulty,
    consumed: false
  },
  collider: {
    width: GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.SIZES.MATH_PROBLEM,
    height: GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.SIZES.MATH_PROBLEM,
    group: 'problem'
  }
});

export const EntityFactory = {
  // Player is unscoped so it survives the screen-exit cleanup that runs on level
  // transitions (preserving score and lives). GameInitializer tears down any
  // leftover player when starting a fresh game.
  createPlayer(x: number, y: number): { id: number } {
    return gameEngine.spawn(playerComponents(x, y));
  },

  createEnemy(commands: Commands, x: number, y: number, enemyType: EnemyType = 'lizard', behaviorType: AIBehavior = 'random'): void {
    commands.spawn(enemyComponents(x, y, enemyType, behaviorType), { scope: 'playing' });
  },

  createMathProblem(commands: Commands, x: number, y: number, value: number, isCorrect: boolean, difficulty: number = 1): void {
    commands.spawn(mathProblemComponents(x, y, value, isCorrect, difficulty), { scope: 'playing' });
  }
};

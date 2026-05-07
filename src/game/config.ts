/**
 * Math Game Configuration
 * Central location for all game constants and settings
 */

export const GAME_CONFIG = {
  // Grid settings
  GRID: {
    WIDTH: 6,
    HEIGHT: 5,
    CELL_SIZE: 106,
  },
  
  // Performance settings
  PERFORMANCE: {
    TARGET_FPS: 60,
    MAX_ENTITIES: 50, // Prevent memory issues
    MAX_ENTITIES_PER_FRAME: 1000, // Maximum entities to process per frame
    PATHFINDING_CACHE_SIZE: 100,  // Maximum cached pathfinding results
    RENDER_CULLING_MARGIN: 50,    // Pixels outside screen to still render
    LOW_FPS_THRESHOLD: 30, // Warn when FPS drops below this
    SLOW_SYSTEM_THRESHOLD: 5, // Warn when system takes more than 5ms
    HIGH_ENTITY_THRESHOLD: 100, // Warn when entity count exceeds this
  },
  
  // Development settings
  DEVELOPMENT: {
    PORT: 3000,
    AUTO_OPEN_BROWSER: true,
    ENABLE_PERFORMANCE_LOGGING: true,
    ENABLE_DEBUG_RENDERING: false,
    LOG_LEVEL: 'info' as const,
  },
  
  // Game mechanics
  GAMEPLAY: {
    PLAYER_LIVES: 3,
    STARTING_SCORE: 0,
    STARTING_LEVEL: 2,
    SCORE_THRESHOLDS: {
      MEDIUM_DIFFICULTY: 50,
      HARD_DIFFICULTY: 200,
    },
  },
  
  // Timing constants
  TIMING: {
    INVULNERABILITY: 2000, // 2 seconds
    FPS_CHECK_INTERVAL: 1000, // 1 second
    CLEANUP_INTERVAL: 5000, // 5 seconds
    BASE_SPAWN_INTERVAL: 3000, // 3 seconds
    MIN_SPAWN_INTERVAL: 1500, // 1.5 seconds
    SHORT_DELAY: 1000, // 1 second
    MEDIUM_DELAY: 2000, // 2 seconds
    LONG_DELAY: 3000, // 3 seconds
  },
  
  // Visual settings
  COLORS: {
    PLAYER: 'blue',
    ENEMY: 'red',
    CORRECT_ANSWER: 'green',      // Legacy - no longer used
    WRONG_ANSWER: 'lightgray',    // Legacy - no longer used
    MATH_PROBLEM: 'lightblue',    // Neutral color for all math problems
    GRID_LINE: '#ddd',
    BACKGROUND: 'white',
  },
  
  // Entity sizes (as fraction of cell size)
  SIZES: {
    PLAYER: 0.8,
    ENEMY: 0.9,
    MATH_PROBLEM: 0.9,
  },
  
  // Render layers (z-index ordering)
  LAYERS: {
    BACKGROUND: 0,
    MATH_PROBLEMS: 1,
    ENTITIES: 2,        // Enemies and other entities
    PLAYER: 3,          // Player (rendered above enemies)
    UI: 10,
  },
  
  // Enemy spawn system configuration
  ENEMY_SPAWN: {
    MAX_ENEMIES: 3,                    // Total enemies in game
    SPAWN_ORDER: ['lizard', 'spider', 'frog'] as const,
    RESET_ON_ALL_DEFEATED: true,      // Restart spawn cycle when all enemies defeated
  },
  
  // Enemy type-specific configurations
  ENEMY_TYPES: {
    LIZARD: {
      COLOR: 'red',                    // Diamond-shaped lizard
      MOVE_SPEED_MULTIPLIER: 1.0,      // Normal movement speed
      AI_BEHAVIORS: ['chase', 'patrol', 'random', 'guard'] as const,
    },
    SPIDER: {
      COLOR: 'purple',                 // 8-legged spider
      MOVE_SPEED_MULTIPLIER: 0.9,      // Slightly slower than lizard
      WEB_DURATION: 8000,              // 8 seconds until web disappears
      WEB_PLACEMENT_CHANCE: 0.20,      // 20% chance per move to place web
      WEB_COOLDOWN: 1000,              // 1 second cooldown between web placements
      FREEZE_DURATION: 2000,           // 2 seconds freeze when caught
      AI_BEHAVIORS: ['random', 'patrol'] as const,
    },
    FROG: {
      COLOR: 'green',                  // Bulging-eyed frog
      MOVE_SPEED_MULTIPLIER: 1.1,      // Slightly faster when not attacking
      TONGUE_RANGE: 3,                 // 3 tiles maximum range
      TONGUE_SPEED: 424,               // Pixels per second (106px/0.25s = 424px/s)
      TONGUE_ATTACK_PROBABILITY: 0.10, // 10% chance per second to attack
      TONGUE_COOLDOWN: 2000,           // 2 seconds between attacks
      TONGUE_HOLD_DURATION: 1000,      // 1 second hold when fully extended
      AI_BEHAVIORS: ['chase', 'random'] as const,
    },
  },
} as const;


// Math problem difficulty settings
export const DIFFICULTY_CONFIG = {
  EASY: {
    level: 1,
    maxNumber: 10,
    operations: ['+', '-'] as const,
  },
  MEDIUM: {
    level: 2,
    maxNumber: 50,
    operations: ['+', '-', '*'] as const,
  },
  HARD: {
    level: 3,
    maxNumber: 100,
    operations: ['+', '-', '*', '/'] as const,
  },
} as const;

// Input key mappings
export const INPUT_KEYS = {
  UP: ['ArrowUp', 'KeyW'],
  DOWN: ['ArrowDown', 'KeyS'],
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  EAT: ['Space', 'Enter'],
  PAUSE: ['Escape'],
} as const;

export const ANIMATION_CONFIG = {
  // Movement animation
  MOVEMENT_DURATION: 750, // milliseconds for grid movement
  
  // Rotation animation
  ROTATION_DURATION_RATIO: 0.25, // Rotation duration as fraction of movement duration
  
  // Shake animation
  SHAKE: {
    WRONG_ANSWER: {
      INTENSITY: 12,
      DURATION: 400
    },
    DAMAGE: {
      INTENSITY: 10,
      DURATION: 350
    }
  },
  
  // Death animation
  DEATH: {
    DURATION: 1000, // 1 second delay before game over
    SPIN_ROTATIONS: 3, // Number of full rotations during death
    SCALE_START: 1.0,
    SCALE_END: 0.0
  }
} as const;

// Score-based difficulty thresholds
export const SCORE_THRESHOLDS = {
  MEDIUM_DIFFICULTY_SCORE: 50,
  HARD_DIFFICULTY_SCORE: 200,
  DIFFICULTY_SCALE_SCORE: 100, // Score points per AI difficulty increase
} as const;

// Math problem generation constants
export const MATH_GENERATION = {
  MAX_RANDOM_VALUE: 144,
  MIN_RANDOM_VALUE: 2,
  MAX_MULTIPLICATION_FACTOR: 12,
} as const;

// Rendering constants
export const RENDER_CONFIG = {
  INVULNERABILITY_OPACITY: 0.5,
  WEB_MARGIN: 5,
  WEB_STROKE_OPACITY: 0.6,
  WEB_PATTERN_STEP: 12,
  WEB_INNER_RADIUS: 8,
} as const; 
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
    CLEANUP_INTERVAL: 5000, // Clean up old entities every 5 seconds
  },
  
  // Game mechanics
  GAMEPLAY: {
    PLAYER_LIVES: 3,
    STARTING_SCORE: 0,
    INVULNERABILITY_TIME: 2000, // 2 seconds
    SCORE_THRESHOLDS: {
      MEDIUM_DIFFICULTY: 50,
      HARD_DIFFICULTY: 200,
    },
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
    BASE_SPAWN_INTERVAL: 3000,        // 3 seconds between spawns
    MIN_SPAWN_INTERVAL: 1500,         // Minimum spawn interval with difficulty scaling
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
      FREEZE_DURATION: 2000,           // 2 seconds freeze when caught
      WEB_PLACEMENT_CHANCE: 0.20,      // 20% chance per move to place web
      WEB_COOLDOWN: 1000,              // 1 second cooldown between web placements
      AI_BEHAVIORS: ['random', 'patrol'] as const,
    },
    FROG: {
      COLOR: 'green',                  // Bulging-eyed frog
      MOVE_SPEED_MULTIPLIER: 1.1,      // Slightly faster when not attacking
      TONGUE_RANGE: 3,                 // 3 tiles maximum range
      TONGUE_SPEED: 424,               // Pixels per second (106px/0.25s = 424px/s)
      TONGUE_ATTACK_PROBABILITY: 0.10, // 10% chance per second to attack
      TONGUE_COOLDOWN: 2000,           // 2 seconds between attacks
      TONGUE_HOLD_DURATION: 1000,     // 1 second hold when fully extended
      AI_BEHAVIORS: ['chase', 'random'] as const,
    },
  },
} as const;

// Legacy compatibility - maintain old naming for existing code
export const GRID_WIDTH = GAME_CONFIG.GRID.WIDTH;
export const GRID_HEIGHT = GAME_CONFIG.GRID.HEIGHT;
export const CELL_SIZE = GAME_CONFIG.GRID.CELL_SIZE;
export const PLAYER_LIVES = GAME_CONFIG.GAMEPLAY.PLAYER_LIVES;
export const STARTING_SCORE = GAME_CONFIG.GAMEPLAY.STARTING_SCORE;

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
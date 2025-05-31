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
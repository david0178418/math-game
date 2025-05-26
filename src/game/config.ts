/**
 * Math Game Configuration
 * Central location for all game constants and settings
 */

export const GAME_CONFIG = {
  // Grid settings
  GRID_WIDTH: 20,
  GRID_HEIGHT: 20,
  CELL_SIZE: 32,
  
  // Performance settings
  TARGET_FPS: 60,
  
  // Game mechanics
  PLAYER_LIVES: 3,
  STARTING_SCORE: 0,
  
  // Visual settings
  COLORS: {
    PLAYER: 'blue',
    ENEMY: 'red',
    CORRECT_ANSWER: 'green',
    WRONG_ANSWER: 'lightgray',
    GRID_LINE: '#ddd',
    BACKGROUND: 'white',
  },
  
  // Entity sizes (as fraction of cell size)
  SIZES: {
    PLAYER: 0.8,
    ENEMY: 0.9,
    MATH_PROBLEM: 0.9,
  },
  
  // Render layers
  LAYERS: {
    BACKGROUND: 0,
    MATH_PROBLEMS: 1,
    ENTITIES: 2,
    UI: 10,
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
  PAUSE: ['Escape', 'Space'],
} as const; 
import { GAME_CONFIG } from '../config';

/**
 * System Configuration Constants
 * Centralized configuration for all ECS systems
 */

// Problem Management System Configuration (unique values not in GAME_CONFIG)
export const PROBLEM_CONFIG = {
  TOTAL_PROBLEMS: 30,           // Total problems needed to fill entire 6x5 grid
} as const;

// AI System Configuration (unique values not in GAME_CONFIG)
export const AI_CONFIG = {
  BASE_MOVE_INTERVAL: 2_500,       // Base milliseconds between enemy moves (slowed down)
  MIN_MOVE_INTERVAL: 800,         // Minimum move interval (fastest)
  DETECTION_RANGE: 6,             // Grid cells within which AI detects player
  CHASE_SPEED_MULTIPLIER: 0.8,    // Chase moves slightly faster
  PATROL_SPEED_MULTIPLIER: 1.2,   // Patrol moves slower
  RANDOM_SPEED_MULTIPLIER: 1.0,   // Random normal speed
  GUARD_SPEED_MULTIPLIER: 1.5,    // Guard moves slowest
  DIFFICULTY_SCALE_SCORE: 100,    // Score points per difficulty increase
  
  // Enemy type-specific speed multipliers
  ENEMY_SPEED_MULTIPLIERS: {
    lizard: GAME_CONFIG.ENEMY_TYPES.lizard.MOVE_SPEED_MULTIPLIER,
    spider: GAME_CONFIG.ENEMY_TYPES.spider.MOVE_SPEED_MULTIPLIER,
    frog: GAME_CONFIG.ENEMY_TYPES.frog.MOVE_SPEED_MULTIPLIER,
  },
} as const;

// System Priorities (for consistent ordering)
export const SYSTEM_PRIORITIES = {
  TIMERS: 95,                   // Timer updates after input, before gameplay intent
  AI: 85,                       // AI behavior
  MOVEMENT: 80,                 // Movement processing
  ANIMATION: 75,                // Animation interpolation (after movement, before collision)
  COLLISION: 70,                // Collision detection
  UI: 50,                       // UI updates
  ENEMY_SPAWN: 40,              // Enemy spawning
  PROBLEM_MANAGEMENT: 30,       // Problem lifecycle
  FROG_TONGUE: 22,              // Frog Tongue system (before render, after problem management)
  RENDER: 10,                   // Rendering (should be last)
} as const;

/**
 * System Configuration Constants
 * Centralized configuration for all ECS systems
 */

// Collision System Configuration
export const COLLISION_CONFIG = {
  INVULNERABILITY_DURATION: 2_000, // 2 seconds in milliseconds
} as const;

// Enemy Spawn System Configuration
export const ENEMY_SPAWN_CONFIG = {
  MAX_ENEMIES: 3,               // Maximum enemies on board (reduced from 4 to 3)
  BASE_SPAWN_INTERVAL: 3_000,   // Base spawn interval in milliseconds (3 seconds)
  MIN_SPAWN_INTERVAL: 1_500,    // Minimum spawn interval (1.5 seconds)
  DIFFICULTY_SCALE_SCORE: 100,  // Score points per difficulty increase
  SPAWN_ORDER: ['lizard', 'spider', 'frog'] as const,
  RESET_ON_ALL_DEFEATED: true,  // Restart spawn cycle when all enemies defeated
} as const;

// Problem Management System Configuration
export const PROBLEM_CONFIG = {
  TOTAL_PROBLEMS: 30,           // Total problems needed to fill entire 6x5 grid
  SPAWN_DELAY: 1_000,            // Milliseconds between spawn attempts
} as const;

// AI System Configuration
export const AI_CONFIG = {
  BASE_MOVE_INTERVAL: 2_500,       // Base milliseconds between enemy moves (slowed down)
  MIN_MOVE_INTERVAL: 800,         // Minimum move interval (fastest)
  PATH_UPDATE_INTERVAL: 2_000,     // Update pathfinding every 2 seconds
  DETECTION_RANGE: 6,             // Grid cells within which AI detects player
  CHASE_SPEED_MULTIPLIER: 0.8,    // Chase moves slightly faster
  PATROL_SPEED_MULTIPLIER: 1.2,   // Patrol moves slower
  RANDOM_SPEED_MULTIPLIER: 1.0,   // Random normal speed
  GUARD_SPEED_MULTIPLIER: 1.5,    // Guard moves slowest
  DIFFICULTY_SCALE_SCORE: 100,    // Score points per difficulty increase
} as const;

// System Priorities (for consistent ordering)
export const SYSTEM_PRIORITIES = {
  INPUT: 100,                   // Input handling
  AI: 85,                       // AI behavior
  MOVEMENT: 80,                 // Movement processing
  ANIMATION: 75,                // Animation interpolation (after movement, before collision)
  COLLISION: 70,                // Collision detection
  UI: 50,                       // UI updates
  ENEMY_SPAWN: 40,              // Enemy spawning
  PROBLEM_MANAGEMENT: 30,       // Problem lifecycle
  FROG_TONGUE: 22,              // Frog Tongue system (before spider web, after problem management)
  SPIDER_WEB: 20,               // Spider Web system (before render, after frog tongue)
  RENDER: 10,                   // Rendering (should be last)
} as const;

// Performance-related configurations
export const PERFORMANCE_CONFIG = {
  MAX_ENTITIES_PER_FRAME: 1000, // Maximum entities to process per frame
  PATHFINDING_CACHE_SIZE: 100,  // Maximum cached pathfinding results
  RENDER_CULLING_MARGIN: 50,    // Pixels outside screen to still render
} as const; 
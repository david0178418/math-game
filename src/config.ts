import lizardImage from './assets/images/lizard.svg';
import spiderImage from './assets/images/spider.png';
import frogImage from './assets/images/frog.svg';

export const GAME_CONFIG = {
  GRID: {
    WIDTH: 6,
    HEIGHT: 5,
    CELL_SIZE: 106,
  },

  GAMEPLAY: {
    PLAYER_LIVES: 3,
    STARTING_SCORE: 0,
    STARTING_LEVEL: 2,
  },

  TIMING: {
    INVULNERABILITY: 2000,
    BASE_SPAWN_INTERVAL: 3000,
    MIN_SPAWN_INTERVAL: 1500,
    SHORT_DELAY: 1000,
  },

  COLORS: {
    PLAYER: 'blue',
    ENEMY: 'red',
    MATH_PROBLEM: 'lightblue',
  },

  SIZES: {
    PLAYER: 0.8,
    ENEMY: 0.9,
    MATH_PROBLEM: 0.9,
  },

  LAYERS: {
    BACKGROUND: 0,
    MATH_PROBLEMS: 1,
    ENTITIES: 2,
    PLAYER: 3,
    UI: 10,
  },

  RENDER: {
    ENTITY_BASELINE_RATIO: 0.75,
    PLAY_AREA_MARGIN_RATIO: 0.65,
  },

  ENEMY_SPAWN: {
    MAX_ENEMIES: 3,
  },

  ENEMY_TYPES: {
    lizard: {
      COLOR: 'red',
      IMAGE: lizardImage,
      MOVE_SPEED_MULTIPLIER: 1.0,
      AI_BEHAVIORS: ['chase', 'patrol', 'random', 'guard'] as const,
    },
    spider: {
      COLOR: 'purple',
      IMAGE: spiderImage,
      MOVE_SPEED_MULTIPLIER: 0.9,
      WEB_DURATION: 8000,
      WEB_PLACEMENT_CHANCE: 0.20,
      WEB_COOLDOWN: 1000,
      FREEZE_DURATION: 2000,
      AI_BEHAVIORS: ['random', 'patrol'] as const,
    },
    frog: {
      COLOR: 'green',
      IMAGE: frogImage,
      MOVE_SPEED_MULTIPLIER: 1.1,
      TONGUE_RANGE: 3,
      TONGUE_SPEED: 424,
      TONGUE_ATTACK_DELAY_MIN: 2000,
      TONGUE_ATTACK_DELAY_MAX: 5000,
      TONGUE_COOLDOWN: 2000,
      TONGUE_HOLD_DURATION: 1000,
      AI_BEHAVIORS: ['chase', 'random'] as const,
    },
  },
} as const;


export const MOVEMENT_CONFIG = {
  // Player top speed in pixels/sec. CELL_SIZE / 0.18s ≈ 590.
  MAX_SPEED: 300,
  // Acceleration applied to ramp up from rest and to brake into the final cell.
  ACCEL: 2000,
  // Duration of the rotation-only tween triggered at corners.
  ROTATION_TWEEN_MS: 100,
  // Hard cap on queued breadcrumbs so a mash doesn't commit the fly to a
  // long uncancelable path. Rewrite-on-reversal handles the common case.
  MAX_QUEUE_LENGTH: 8,
} as const;

export const ANIMATION_CONFIG = {
  MOVEMENT_DURATION: 750,
  ROTATION_DURATION_RATIO: 0.25,
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
  DEATH: {
    DURATION: 1000,
    SPIN_ROTATIONS: 3,
    SCALE_START: 1.0,
    SCALE_END: 0.0
  }
} as const;

export const SCORE_THRESHOLDS = {
  MEDIUM_DIFFICULTY_SCORE: 50,
  HARD_DIFFICULTY_SCORE: 200,
  DIFFICULTY_SCALE_SCORE: 100,
} as const;

export const MATH_GENERATION = {
  MAX_RANDOM_VALUE: 144,
  MIN_RANDOM_VALUE: 2,
  MAX_MULTIPLICATION_FACTOR: 12,
} as const;

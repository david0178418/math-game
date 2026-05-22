import type { Timer, TimerComponentTypes } from 'ecspresso/plugins/scripting/timers';
import type { TweenComponentTypes } from 'ecspresso/plugins/scripting/tween';
import type { CoroutineComponentTypes } from 'ecspresso/plugins/scripting/coroutine';
import type { AIBehavior, EnemyType } from '../types/shared';

export type GameAction = 'up' | 'down' | 'left' | 'right' | 'eat' | 'pause';

export type TimerSlot =
  | 'webExpiry'
  | 'freeze'
  | 'invulnerability'
  | 'deathDelay'
  | 'enemyMove'
  | 'enemySpawn'
  | 'problemSpawn';

export type GameTimer = Timer<TimerSlot>;

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
    imageSrc?: string;
    imageWidth?: number;
    imageHeight?: number;
    spriteSheet?: {
      frameCount: number;
      frameIndex: number;
      flipX?: boolean;
    };
  };
  spriteAnimation: {
    elapsed: number;
    duration: number;
    currentStep: number;
    steps: Array<{
      imageSrc: string;
      frameCount: number;
      duration: number;
      flipX?: boolean;
      reverse?: boolean;
      staticFrameIndex?: number;
    }>;
  };
  frogSprite: {
    facing: 'toward' | 'away' | 'left' | 'right';
  };
  player: {
    score: number;
    lives: number;
    gameOverPending?: boolean;
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
    maxRange: number;
    currentLength: number;
    segments: Array<{ x: number; y: number }>;
    phase: 'idle' | 'extending' | 'holding' | 'retracting';
  };
  pathFollower: {
    // Grid cell the fly was last snapped to; the implicit "behind" waypoint
    // that the fly returns to when the queue is truncated to empty mid-segment.
    anchorGridX: number;
    anchorGridY: number;
    breadcrumbs: Array<{ x: number; y: number }>;
    speed: number;
  };
}

export type AllComponents = Components
  & TimerComponentTypes<TimerSlot>
  & TweenComponentTypes
  & CoroutineComponentTypes;

// Must be a `type` (not `interface`) so it satisfies ecspresso's
// `Record<string, unknown>` screen-config constraint.
export type PlayingScreenConfig = { level: number; isFreshGame: boolean };

export type GameMode = 'multiples';

export interface Resources {
  gameMode: GameMode;
  currentLevel: number;
  enemySpawn: { index: number };
}

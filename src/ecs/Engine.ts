import ECSpresso from 'ecspresso';
import { createInputPlugin } from 'ecspresso/plugins/input/input';
import { createTimerPlugin } from 'ecspresso/plugins/scripting/timers';
import { createTweenPlugin } from 'ecspresso/plugins/scripting/tween';
import { createCoroutinePlugin } from 'ecspresso/plugins/scripting/coroutine';
import { SYSTEM_PRIORITIES } from './systemConfigs';
import { GAME_CONFIG } from '../game/config';
import type {
  Components,
  Resources,
  GameAction,
  TimerSlot,
  PlayingScreenConfig,
} from './types';

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

export const gameEngine = ECSpresso.create()
  .withPlugin(inputPlugin)
  .withPlugin(timerPlugin)
  .withPlugin(tweenPlugin)
  .withPlugin(coroutinePlugin)
  .withComponentTypes<Components>()
  .withResourceTypes<Resources>()
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

let lastFrameTime = 0;
let gameRunning = false;

export async function initializeEngine(): Promise<void> {
  await gameEngine.initialize();
  console.log('ECSpresso engine initialized');
}

export function startGameLoop(): void {
  if (gameRunning) return;

  gameRunning = true;
  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
  console.log('Game loop started');
}

function gameLoop(currentTime: number): void {
  if (!gameRunning) return;

  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  gameEngine.update(deltaTime);

  requestAnimationFrame(gameLoop);
}

import ECSpresso from 'ecspresso';
import { createInputPlugin, gamepadAxisOn, gamepadButtonsOn } from 'ecspresso/plugins/input/input';
import { createTimerPlugin } from 'ecspresso/plugins/scripting/timers';
import { createTweenPlugin } from 'ecspresso/plugins/scripting/tween';
import { createCoroutinePlugin } from 'ecspresso/plugins/scripting/coroutine';
import { SYSTEM_PRIORITIES } from './systemConfigs';
import { GAME_CONFIG } from '../config';
import type {
  Components,
  Resources,
  GameAction,
  TimerSlot,
  PlayingScreenConfig,
} from './types';

// Gamepad button indices follow the Standard Gamepad mapping
// (https://www.w3.org/TR/gamepad/#dfn-standard-gamepad). Button 9 = Start,
// buttons 12-15 = D-pad up/down/left/right, axes 0/1 = left stick X/Y.
const inputPlugin = createInputPlugin<GameAction>({
  actions: {
    up:    { keys: ['ArrowUp',    'w', 'W'], gamepadButtons: gamepadButtonsOn(0, 12), gamepadAxes: [gamepadAxisOn(0, 1, -1)] },
    down:  { keys: ['ArrowDown',  's', 'S'], gamepadButtons: gamepadButtonsOn(0, 13), gamepadAxes: [gamepadAxisOn(0, 1,  1)] },
    left:  { keys: ['ArrowLeft',  'a', 'A'], gamepadButtons: gamepadButtonsOn(0, 14), gamepadAxes: [gamepadAxisOn(0, 0, -1)] },
    right: { keys: ['ArrowRight', 'd', 'D'], gamepadButtons: gamepadButtonsOn(0, 15), gamepadAxes: [gamepadAxisOn(0, 0,  1)] },
    eat:   { keys: [' ', 'Enter'],           gamepadButtons: gamepadButtonsOn(0, 0) },
    pause: { keys: ['Escape'],               gamepadButtons: gamepadButtonsOn(0, 9) },
  },
  preventDefaultKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'],
});

const timerPlugin = createTimerPlugin<TimerSlot>({ priority: SYSTEM_PRIORITIES.TIMERS });
// Priority slots tween between movement and render so render reads the
// just-interpolated values, not last frame's.
const tweenPlugin = createTweenPlugin({ priority: SYSTEM_PRIORITIES.ANIMATION });
const coroutinePlugin = createCoroutinePlugin({
  priority: SYSTEM_PRIORITIES.FROG_TONGUE,
  phase: 'preUpdate',
});

export const gameEngine = ECSpresso.create()
  .withPlugin(inputPlugin)
  .withPlugin(timerPlugin)
  .withPlugin(tweenPlugin)
  .withPlugin(coroutinePlugin)
  .withComponentTypes<Components>()
  .withResourceTypes<Resources>()
  .withResource('gameMode', 'multiples')
  .withResource('currentLevel', GAME_CONFIG.GAMEPLAY.STARTING_LEVEL)
  .withResource('enemySpawn', { index: 0 })
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

import { initializeEngine, startGameLoop, gameEngine } from './Engine';
import { createPlayer } from './entities';
import type { PlayingScreenConfig } from './types';
import { addMovementSystemToEngine } from './systems/MovementSystem';
import { gridToPixel } from './gameUtils';
import { addShakeSystemToEngine } from './systems/AnimationSystem';
import {
  initializeRenderSystem,
  addRenderSystemToEngine
} from './systems/RenderSystem';
import { addCollisionSystemToEngine } from './systems/CollisionSystem';
import { addPauseSystemToEngine } from './systems/PauseSystem';
import { addUINavigationSystemToEngine } from './systems/UINavigationSystem';
import { gameplayPlugin } from './gameplayPlugin';
import { playerQuery } from './queries';
import { showScreen, updateObjective, setFinalScore } from '../ui/UIManager';

const setupCanvas = (): void => {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
  if (!canvas) throw new Error('Canvas element not found');
  initializeRenderSystem(canvas);
};

/**
 * Set up game state for a 'playing' screen entry.
 *
 * On fresh game: tear down any leftover player (e.g. from a prior gameOver)
 * and create a new one — the player is unscoped so it survives screen exits.
 * On level transition: leave the existing player so score and lives persist.
 */
const enterPlayingScreen = ({ level, isFreshGame }: PlayingScreenConfig): void => {
  gameEngine.setResource('currentLevel', level);

  if (isFreshGame) {
    const existingPlayer = gameEngine.tryGetSingleton(playerQuery.with);
    if (existingPlayer) gameEngine.removeEntity(existingPlayer.id);

    const playerPixelPos = gridToPixel(3, 2);
    createPlayer(playerPixelPos.x, playerPixelPos.y);

    gameEngine.setResource('enemySpawn', { index: 0 });
  }
};

/**
 * Wire screen lifecycle hooks. ECS screen state drives DOM, not vice versa.
 */
const setupScreenHooks = (): void => {
  gameEngine.onScreenEnter('menu', () => {
    showScreen('menu');
  });

  gameEngine.onScreenEnter('playing', ({ config }) => {
    showScreen('playing');
    setupCanvas();
    enterPlayingScreen(config);
    updateObjective(config.level);
  });

  gameEngine.onScreenEnter('paused', () => {
    showScreen('paused');
  });

  gameEngine.onScreenEnter('gameOver', () => {
    const player = gameEngine.tryGetSingleton(playerQuery.with);
    setFinalScore(player?.components.player.score ?? 0);
    showScreen('gameOver');
  });
};

const registerSystems = async (): Promise<void> => {
  gameEngine.installPlugin(gameplayPlugin);

  addMovementSystemToEngine();
  addShakeSystemToEngine();
  addCollisionSystemToEngine();
  addPauseSystemToEngine();
  addUINavigationSystemToEngine();
  addRenderSystemToEngine();

  await initializeEngine();
};

export const initializeGame = async (): Promise<void> => {
  await registerSystems();
  setupScreenHooks();
  await gameEngine.setScreen('menu', {});
  startGameLoop();
};

import { initializeEngine, startGameLoop, gameEngine } from '../ecs/Engine';
import { createPlayer } from '../ecs/entities';
import type { PlayingScreenConfig } from '../ecs/types';
import { addMovementSystemToEngine } from '../ecs/systems/MovementSystem';
import { gridToPixel } from '../ecs/gameUtils';
import { addShakeSystemToEngine } from '../ecs/systems/AnimationSystem';
import {
  initializeRenderSystem,
  addRenderSystemToEngine
} from '../ecs/systems/RenderSystem';
import { addCollisionSystemToEngine } from '../ecs/systems/CollisionSystem';
import { gameplayPlugin } from '../ecs/gameplayPlugin';
import { playerQuery } from '../ecs/queries';
import { showScreen, updateObjective } from './UIManager';

/**
 * Game Initializer
 * Handles all game setup and system initialization
 */
export class GameInitializer {
  async initialize(): Promise<void> {
    await this.initializeSystems();

    this.setupScreenHooks();
    await gameEngine.setScreen('menu', {});
  }

  /**
   * Wire screen lifecycle hooks. ECS screen state drives DOM, not vice versa.
   */
  private setupScreenHooks(): void {
    gameEngine.onScreenEnter('menu', () => {
      showScreen('menu');
    });

    gameEngine.onScreenEnter('playing', ({ config }) => {
      showScreen('playing');
      this.setupCanvas();
      this.enterPlayingScreen(config);
      updateObjective(config.level);
      startGameLoop();
    });

    gameEngine.onScreenEnter('paused', () => {
      showScreen('paused');
    });

    gameEngine.onScreenEnter('gameOver', () => {
      const player = gameEngine.tryGetSingleton(playerQuery.with);
      const finalScore = player?.components.player.score ?? 0;
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.textContent = `Final Score: ${finalScore}`;
      }
      showScreen('gameOver');
    });
  }

  private async initializeSystems(): Promise<void> {
    gameEngine.installPlugin(gameplayPlugin);

    addMovementSystemToEngine();    // Priority 80  - Movement processing
    addShakeSystemToEngine();       // Priority 75  - Shake effect (tween plugin handles other animations)
    addCollisionSystemToEngine();   // Priority 70  - Collision detection
    addRenderSystemToEngine();      // Priority 10  - Rendering (lowest)

    await initializeEngine();
  }

  private setupCanvas(): void {
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    initializeRenderSystem(canvas);
  }

  /**
   * Set up game state for a 'playing' screen entry.
   *
   * On fresh game: tear down any leftover player (e.g. from a prior gameOver)
   * and create a new one — the player is unscoped so it survives screen exits.
   * On level transition: leave the existing player so score and lives persist.
   */
  private enterPlayingScreen({ level, isFreshGame }: PlayingScreenConfig): void {
    gameEngine.setResource('currentLevel', level);

    if (isFreshGame) {
      const existingPlayer = gameEngine.tryGetSingleton(playerQuery.with);
      if (existingPlayer) gameEngine.removeEntity(existingPlayer.id);

      const playerPixelPos = gridToPixel(3, 2);
      createPlayer(playerPixelPos.x, playerPixelPos.y);
    }
  }
}

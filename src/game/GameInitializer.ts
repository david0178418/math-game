import { 
  initializeEngine, 
  startGameLoop, 
  EntityFactory,
  gameEngine
} from '../ecs/Engine';
import { 
  initializeInputSystem, 
  addInputSystemToEngine 
} from '../ecs/systems/InputSystem';
import { 
  addMovementSystemToEngine,
  gridToPixel 
} from '../ecs/systems/MovementSystem';
import { 
  addAnimationSystemToEngine 
} from '../ecs/systems/AnimationSystem';
import { 
  initializeRenderSystem, 
  addRenderSystemToEngine 
} from '../ecs/systems/RenderSystem';
import { addCollisionSystemToEngine } from '../ecs/systems/CollisionSystem';
import { addUISystemToEngine } from '../ecs/systems/UISystem';
import { addProblemManagementSystemToEngine } from '../ecs/systems/ProblemManagementSystem';
import { addAISystemToEngine } from '../ecs/systems/AISystem';
import { addEnemySpawnSystemToEngine } from '../ecs/systems/EnemySpawnSystem';
import { addSpiderWebSystemToEngine } from '../ecs/systems/SpiderWebSystem';
import { addFrogTongueSystemToEngine } from '../ecs/systems/FrogTongueSystem';
import { uiManager } from './UIManager';

/**
 * Game Initializer
 * Handles all game setup and system initialization
 */
export class GameInitializer {
  private canvas: HTMLCanvasElement | null = null;

  /**
   * Initialize the complete game
   */
  async initialize(): Promise<void> {
    // UI Manager handles HTML setup now
    await this.initializeSystems();

    this.setupScreenHooks();
    await gameEngine.setScreen('menu', {});
  }

  /**
   * Wire screen lifecycle hooks. ECS screen state drives DOM, not vice versa.
   */
  private setupScreenHooks(): void {
    gameEngine.onScreenEnter('menu', () => {
      uiManager.showScreen('menu');
    });

    gameEngine.onScreenEnter('playing', () => {
      uiManager.showScreen('playing');
      this.setupCanvas();
      this.createEntities();
      this.startGame();
    });

    gameEngine.onScreenEnter('paused', () => {
      uiManager.showScreen('paused');
    });

    gameEngine.onScreenEnter('gameOver', () => {
      const player = gameEngine.entityManager.getEntitiesWithQuery(['player']).at(0);
      const finalScore = player?.components.player.score ?? 0;
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.textContent = `Final Score: ${finalScore}`;
      }
      uiManager.showScreen('gameOver');
    });
  }

  /**
   * Initialize all ECS systems
   */
  private async initializeSystems(): Promise<void> {
    addInputSystemToEngine();       // Priority 100 - Input handling
    addAISystemToEngine();          // Priority 85  - AI behavior
    addMovementSystemToEngine();    // Priority 80  - Movement processing
    addAnimationSystemToEngine();   // Priority 75  - Animation (after movement)
    addCollisionSystemToEngine();   // Priority 70  - Collision detection
    addUISystemToEngine();          // Priority 50  - UI updates
    addEnemySpawnSystemToEngine();  // Priority 40  - Enemy spawning
    addProblemManagementSystemToEngine(); // Priority 30  - Problem spawning
    addFrogTongueSystemToEngine();  // Priority 22  - Frog Tongue system
    addSpiderWebSystemToEngine();   // Priority 20  - Spider Web system

    await initializeEngine();

    initializeInputSystem();

    console.log('Core systems initialized (render system will be added when canvas is ready)');
  }

  /**
   * Get and validate the canvas element, initialize render system
   */
  private setupCanvas(): void {
    this.canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    // Now initialize render system with the canvas
    initializeRenderSystem(this.canvas);
    addRenderSystemToEngine();      // Priority 10  - Rendering (lowest)
    
    console.log('Render system initialized');
  }

  /**
   * Start the game loop
   */
  private startGame(): void {
    startGameLoop();
    console.log('Math Game Phase 6 started successfully!');
  }

  /**
   * Create initial game entities
   */
  private createEntities(): void {
    // Reset game state first
    this.resetGameState();
    
    // Create player in center of grid (3,2 for 6x5 grid)
    const playerGridPos = { x: 3, y: 2 };
    const playerPixelPos = gridToPixel(playerGridPos.x, playerGridPos.y);
    EntityFactory.createPlayer(playerPixelPos.x, playerPixelPos.y);

    // Create initial set of math problems
    this.createInitialMathProblems();
    
    // Create initial enemies
    this.createInitialEnemies();
  }

  /**
   * Reset global game state
   */
  private resetGameState(): void {
    gameEngine.setResource('score', { value: 0 });

    console.log('Game state reset for new game');
  }

  /**
   * Create initial math problems based on game mode
   */
  private createInitialMathProblems(): void {
    // The ProblemManagementSystem will handle creating problems based on the game mode
    // So we'll just create a few starter problems
    console.log('Initial math problems will be created by ProblemManagementSystem');
  }

  /**
   * Create initial enemy entities (now starts with 0 enemies)
   */
  private createInitialEnemies(): void {
    // Start with no enemies - they will be spawned dynamically by the EnemySpawnSystem
    console.log('Starting with 0 enemies - they will spawn dynamically from edges');
  }
} 
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
  initializeRenderSystem, 
  addRenderSystemToEngine 
} from '../ecs/systems/RenderSystem';
import { addCollisionSystemToEngine } from '../ecs/systems/CollisionSystem';
import { addUISystemToEngine } from '../ecs/systems/UISystem';
import { addProblemManagementSystemToEngine } from '../ecs/systems/ProblemManagementSystem';
import { addAISystemToEngine } from '../ecs/systems/AISystem';
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
    
    // Set up integration between UI and game systems
    this.setupUIIntegration();
    
    // Show main menu (entities will be created when game starts)
    uiManager.showScreen('menu');
  }



  /**
   * Initialize all ECS systems
   */
  private async initializeSystems(): Promise<void> {
    // Initialize ECS engine
    initializeEngine();

    // Initialize input system (doesn't need canvas)
    initializeInputSystem();

    // Add all non-render systems to engine in priority order
    addInputSystemToEngine();       // Priority 100 - Input handling
    addMovementSystemToEngine();    // Priority 90  - Movement processing
    addAISystemToEngine();          // Priority 85  - AI behavior
    addCollisionSystemToEngine();   // Priority 70  - Collision detection
    addUISystemToEngine();          // Priority 50  - UI updates
    addProblemManagementSystemToEngine(); // Priority 30  - Problem spawning

    console.log('Core Phase 6 systems initialized (render system will be added when canvas is ready)');
  }

  /**
   * Create initial game entities
   */
  private createEntities(): void {
    // Reset game state first
    this.resetGameState();
    
    // Create player in center of grid
    const playerGridPos = { x: 10, y: 10 };
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
    // Reset any global resources
    gameEngine.addResource('gameState', 'playing');
    gameEngine.addResource('score', { value: 0 });
    
    console.log('Game state reset for new game');
  }

  /**
   * Create initial math problems (fewer since ProblemManagementSystem will spawn more)
   */
  private createInitialMathProblems(): void {
    const problems = [
      // Correct answers (green)
      { gridX: 5, gridY: 5, value: 5, isCorrect: true },
      { gridX: 15, gridY: 5, value: 8, isCorrect: true },
      { gridX: 5, gridY: 15, value: 12, isCorrect: true },
      { gridX: 15, gridY: 15, value: 7, isCorrect: true },
      
      // Incorrect answers (gray)
      { gridX: 8, gridY: 8, value: 13, isCorrect: false },
      { gridX: 12, gridY: 8, value: 17, isCorrect: false },
    ];

    for (const problem of problems) {
      const pixelPos = gridToPixel(problem.gridX, problem.gridY);
      EntityFactory.createMathProblem(
        pixelPos.x, 
        pixelPos.y, 
        problem.value, 
        problem.isCorrect, 
        1
      );
    }

    console.log(`Created ${problems.length} initial math problems`);
  }

  /**
   * Create initial enemy entities
   */
  private createInitialEnemies(): void {
    const enemies = [
      // Chase enemy - will pursue the player
      { gridX: 3, gridY: 3, behaviorType: 'chase' as const },
      
      // Random enemy - moves randomly
      { gridX: 17, gridY: 3, behaviorType: 'random' as const },
      
      // Patrol enemy - follows a set path
      { gridX: 3, gridY: 17, behaviorType: 'patrol' as const },
      
      // Guard enemy - stays in one area
      { gridX: 17, gridY: 17, behaviorType: 'guard' as const },
    ];

    for (const enemy of enemies) {
      const pixelPos = gridToPixel(enemy.gridX, enemy.gridY);
      EntityFactory.createEnemy(
        pixelPos.x, 
        pixelPos.y, 
        enemy.behaviorType
      );
    }

    console.log(`Created ${enemies.length} initial enemies`);
  }

  /**
   * Set up integration between UI and game systems
   */
  private setupUIIntegration(): void {
    // Override the UIManager's startGame method to properly initialize entities
    const originalStartGame = uiManager['startGame'].bind(uiManager);
    uiManager['startGame'] = () => {
      // First show the playing screen to create the canvas element
      originalStartGame();
      
      // Then set up the canvas and game entities
      setTimeout(() => {
        this.setupCanvas();
        this.createEntities();
        this.startGame();
      }, 0); // Use setTimeout to ensure DOM update completes
    };
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
} 
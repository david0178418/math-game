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
import { addEnemySpawnSystemToEngine } from '../ecs/systems/EnemySpawnSystem';
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
    addEnemySpawnSystemToEngine();  // Priority 40  - Enemy spawning
    addProblemManagementSystemToEngine(); // Priority 30  - Problem spawning

    console.log('Core Phase 6 systems initialized (render system will be added when canvas is ready)');
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
    // Reset any global resources
    gameEngine.addResource('gameState', 'playing');
    gameEngine.addResource('score', { value: 0 });
    
    // Ensure gameMode and currentLevel are set (may already be set by UIManager)
    if (!gameEngine.getResource('gameMode')) {
      gameEngine.addResource('gameMode', 'multiples');
    }
    if (!gameEngine.getResource('currentLevel')) {
      gameEngine.addResource('currentLevel', 2);
    }
    
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
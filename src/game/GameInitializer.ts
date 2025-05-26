import { 
  initializeEngine, 
  startGameLoop, 
  EntityFactory
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
    this.setupHTML();
    this.setupCanvas();
    await this.initializeSystems();
    this.createEntities();
    this.startGame();
  }

  /**
   * Set up the game HTML structure
   */
  private setupHTML(): void {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div id="game-container">
        <div id="game-ui">
          <h1>Math Game</h1>
          <p>Use WASD or Arrow Keys to move</p>
          <p>Collect green squares (correct answers)!</p>
          <p>Avoid gray squares (wrong answers)!</p>
          <div id="score">Score: 0</div>
        </div>
        <canvas id="game-canvas"></canvas>
      </div>
    `;
  }

  /**
   * Get and validate the canvas element
   */
  private setupCanvas(): void {
    this.canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
  }

  /**
   * Initialize all ECS systems
   */
  private async initializeSystems(): Promise<void> {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    // Initialize ECS engine
    initializeEngine();

    // Initialize system managers
    initializeInputSystem();
    initializeRenderSystem(this.canvas);

    // Add all systems to engine in priority order
    addInputSystemToEngine();       // Priority 100 - Input handling
    addMovementSystemToEngine();    // Priority 90  - Movement processing
    addAISystemToEngine();          // Priority 85  - AI behavior
    addCollisionSystemToEngine();   // Priority 70  - Collision detection
    addUISystemToEngine();          // Priority 50  - UI updates
    addProblemManagementSystemToEngine(); // Priority 30  - Problem spawning
    addRenderSystemToEngine();      // Priority 10  - Rendering (lowest)

    console.log('All Phase 5 systems initialized');
  }

  /**
   * Create initial game entities
   */
  private createEntities(): void {
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
   * Start the game loop
   */
  private startGame(): void {
    startGameLoop();
    console.log('Math Game Phase 5 started successfully!');
  }
} 
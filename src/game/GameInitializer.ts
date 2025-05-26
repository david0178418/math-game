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

    // Add systems to engine
    addInputSystemToEngine();
    addMovementSystemToEngine();
    addRenderSystemToEngine();

    console.log('All systems initialized');
  }

  /**
   * Create initial game entities
   */
  private createEntities(): void {
    // Create player in center of grid
    const playerGridPos = { x: 10, y: 10 };
    const playerPixelPos = gridToPixel(playerGridPos.x, playerGridPos.y);
    EntityFactory.createPlayer(playerPixelPos.x, playerPixelPos.y);

    // Create demo math problems
    this.createDemoMathProblems();
  }

  /**
   * Create demonstration math problems
   */
  private createDemoMathProblems(): void {
    const problems = [
      // Correct answers (green)
      { gridX: 5, gridY: 5, value: 10, isCorrect: true },
      { gridX: 15, gridY: 5, value: 15, isCorrect: true },
      { gridX: 5, gridY: 15, value: 20, isCorrect: true },
      { gridX: 15, gridY: 15, value: 25, isCorrect: true },
      
      // Incorrect answers (gray)
      { gridX: 8, gridY: 8, value: 13, isCorrect: false },
      { gridX: 12, gridY: 8, value: 17, isCorrect: false },
      { gridX: 8, gridY: 12, value: 19, isCorrect: false },
      { gridX: 12, gridY: 12, value: 23, isCorrect: false },
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

    console.log(`Created ${problems.length} math problems`);
  }

  /**
   * Start the game loop
   */
  private startGame(): void {
    startGameLoop();
    console.log('Math Game started successfully!');
  }
} 